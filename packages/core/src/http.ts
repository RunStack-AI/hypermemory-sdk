/**
 * Low-level HTTP transport with automatic retry, rate-limit handling,
 * and timeout support via AbortController.
 */

import {
	AuthenticationError,
	BadRequestError,
	ForbiddenError,
	HyperMemoryError,
	NetworkError,
	NotFoundError,
	PlanLimitError,
	RateLimitError,
	ServerError,
	TimeoutError,
	ValidationError,
} from "./errors.js";
import type { RateLimitInfo } from "./types.js";

export interface HttpClientOptions {
	baseUrl: string;
	apiKey: string;
	maxRetries: number;
	timeout: number;
	onRequest?: (method: string, url: string, status: number, durationMs: number) => void;
}

export interface RequestOptions {
	method: "GET" | "POST" | "DELETE" | "PUT" | "PATCH";
	path: string;
	body?: unknown;
	params?: Record<string, string>;
	signal?: AbortSignal;
}

type AttemptResult<T> =
	| { type: "success"; data: T; status: number }
	| { type: "retry"; error: Error; status: number }
	| { type: "fatal"; error: Error; status: number };

export class HttpClient {
	private readonly baseUrl: string;
	private readonly apiKey: string;
	private readonly maxRetries: number;
	private readonly timeout: number;
	private readonly onRequest?: HttpClientOptions["onRequest"];

	/** Most recent rate limit info from the last response */
	lastRateLimit: RateLimitInfo | null = null;

	constructor(options: HttpClientOptions) {
		this.baseUrl = options.baseUrl.replace(/\/$/, "");
		this.apiKey = options.apiKey;
		this.maxRetries = options.maxRetries;
		this.timeout = options.timeout;
		this.onRequest = options.onRequest;
	}

	async request<T>(options: RequestOptions): Promise<T> {
		const url = this.buildUrl(options.path, options.params);
		let lastError: Error | null = null;

		for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
			if (attempt > 0) {
				const delay = this.getBackoffDelay(attempt, lastError);
				await this.sleep(delay);
			}

			const start = Date.now();
			const result = await this.attemptOnce<T>(url, options);
			const duration = Date.now() - start;

			switch (result.type) {
				case "success":
					this.onRequest?.(options.method, url, result.status, duration);
					return result.data;

				case "retry":
					this.onRequest?.(options.method, url, result.status, duration);
					lastError = result.error;
					continue;

				case "fatal":
					this.onRequest?.(options.method, url, result.status, duration);
					throw result.error;
			}
		}

		throw lastError ?? new NetworkError("Request failed after all retries");
	}

	private async attemptOnce<T>(url: string, options: RequestOptions): Promise<AttemptResult<T>> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);

		const signal = options.signal
			? this.combineSignals(options.signal, controller.signal)
			: controller.signal;

		try {
			const response = await fetch(url, {
				method: options.method,
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: options.body ? JSON.stringify(options.body) : undefined,
				signal,
			});

			clearTimeout(timeoutId);
			this.parseRateLimitHeaders(response.headers);

			if (response.ok) {
				const data = (await response.json()) as T;
				return { type: "success", data, status: response.status };
			}

			const errorBody = await response.text();
			const error = this.createError(response.status, errorBody, response.headers);

			if (this.isRetryable(response.status, options.method)) {
				return { type: "retry", error, status: response.status };
			}

			return { type: "fatal", error, status: response.status };
		} catch (err) {
			clearTimeout(timeoutId);

			if (err instanceof HyperMemoryError) {
				return { type: "fatal", error: err, status: err.status };
			}

			if (err instanceof DOMException && err.name === "AbortError") {
				if (options.signal?.aborted) {
					return { type: "fatal", error: new NetworkError("Request was cancelled"), status: 0 };
				}
				return { type: "retry", error: new TimeoutError(this.timeout), status: 0 };
			}

			const networkErr = new NetworkError(
				err instanceof Error ? err.message : "Network request failed",
			);
			return { type: "retry", error: networkErr, status: 0 };
		}
	}

	private buildUrl(path: string, params?: Record<string, string>): string {
		const normalizedPath = path.replace(/^\/?/, "/");
		const url = new URL(normalizedPath, this.baseUrl);
		if (params) {
			for (const [key, value] of Object.entries(params)) {
				url.searchParams.set(key, value);
			}
		}
		return url.toString();
	}

	private parseRateLimitHeaders(headers: Headers): void {
		const limit = headers.get("X-RateLimit-Limit");
		const remaining = headers.get("X-RateLimit-Remaining");
		const reset = headers.get("X-RateLimit-Reset");

		if (limit && remaining && reset) {
			this.lastRateLimit = {
				limit: Number.parseInt(limit, 10),
				remaining: Number.parseInt(remaining, 10),
				resetAt: new Date(Number.parseInt(reset, 10) * 1000),
			};
		}
	}

	private createError(status: number, body: string, headers: Headers): HyperMemoryError {
		let message = `HTTP ${status}`;
		try {
			const parsed = JSON.parse(body) as { detail?: string; message?: string; plan?: string };
			message = parsed.detail ?? parsed.message ?? message;
			if (status === 403 && parsed.plan) {
				return new PlanLimitError(message, parsed.plan, body);
			}
		} catch {
			if (body.length > 0 && body.length < 500) {
				message = body;
			}
		}

		switch (status) {
			case 400:
				return new BadRequestError(message, body);
			case 401:
				return new AuthenticationError(message, status, body);
			case 403:
				return new ForbiddenError(message, body);
			case 404:
				return new NotFoundError(message, body);
			case 422:
				return new ValidationError(message, body);
			case 429: {
				const retryAfter =
					this.parseRetryAfterFromHeader(headers) ?? this.parseRetryAfterFromBody(body);
				return new RateLimitError(message, retryAfter, 0, 60, body);
			}
			default:
				if (status >= 500) {
					return new ServerError(message, status, body);
				}
				return new HyperMemoryError(message, status, "unknown_error", body);
		}
	}

	private parseRetryAfterFromHeader(headers: Headers): number | null {
		const value = headers.get("Retry-After") ?? headers.get("retry-after");
		if (!value) return null;
		const seconds = Number.parseInt(value, 10);
		if (!Number.isNaN(seconds) && seconds > 0) return seconds;
		const date = Date.parse(value);
		if (!Number.isNaN(date)) {
			return Math.max(1, Math.ceil((date - Date.now()) / 1000));
		}
		return null;
	}

	private parseRetryAfterFromBody(body: string): number {
		try {
			const parsed = JSON.parse(body) as { retry_after?: number };
			if (parsed.retry_after && parsed.retry_after > 0) return parsed.retry_after;
		} catch {
			// Fall through
		}
		return 60;
	}

	private isRetryable(status: number, method: string): boolean {
		// 429 retries all methods — the server didn't process the request, so no double-write risk
		if (status === 429) return true;
		if (status === 502 || status === 503 || status === 504) {
			return method === "GET" || method === "HEAD" || method === "DELETE";
		}
		return false;
	}

	private getBackoffDelay(attempt: number, lastError: Error | null): number {
		if (lastError instanceof RateLimitError && lastError.retryAfter > 0) {
			return lastError.retryAfter * 1000;
		}
		const base = Math.min(1000 * 2 ** (attempt - 1), 30000);
		const jitter = Math.random() * 500;
		return base + jitter;
	}

	private combineSignals(userSignal: AbortSignal, timeoutSignal: AbortSignal): AbortSignal {
		if (typeof AbortSignal.any === "function") {
			return AbortSignal.any([userSignal, timeoutSignal]);
		}
		const controller = new AbortController();
		const onUserAbort = () => {
			controller.abort();
			timeoutSignal.removeEventListener("abort", onTimeoutAbort);
		};
		const onTimeoutAbort = () => {
			controller.abort();
			userSignal.removeEventListener("abort", onUserAbort);
		};
		userSignal.addEventListener("abort", onUserAbort, { once: true });
		timeoutSignal.addEventListener("abort", onTimeoutAbort, { once: true });
		return controller.signal;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
