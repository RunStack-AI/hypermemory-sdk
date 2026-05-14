/**
 * Low-level HTTP transport with automatic retry, rate-limit handling,
 * and timeout support via AbortController.
 */

import {
	AuthenticationError,
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
}

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
			let status = 0;

			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), this.timeout);

				const response = await fetch(url, {
					method: options.method,
					headers: {
						Authorization: `Bearer ${this.apiKey}`,
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					body: options.body ? JSON.stringify(options.body) : undefined,
					signal: controller.signal,
				});

				clearTimeout(timeoutId);
				status = response.status;
				this.parseRateLimitHeaders(response.headers);

				if (response.ok) {
					const data = (await response.json()) as T;
					return data;
				}

				const errorBody = await response.text();
				const error = this.createError(status, errorBody);

				if (this.isRetryable(status) && attempt < this.maxRetries) {
					lastError = error;
					continue;
				}

				throw error;
			} catch (err) {
				if (err instanceof HyperMemoryError) {
					this.onRequest?.(options.method, url, status, Date.now() - start);
					throw err;
				}

				if (err instanceof DOMException && err.name === "AbortError") {
					const timeoutErr = new TimeoutError(this.timeout);
					if (attempt < this.maxRetries) {
						lastError = timeoutErr;
						continue;
					}
					this.onRequest?.(options.method, url, 0, Date.now() - start);
					throw timeoutErr;
				}

				const networkErr = new NetworkError(
					err instanceof Error ? err.message : "Network request failed",
				);
				if (attempt < this.maxRetries) {
					lastError = networkErr;
					continue;
				}
				this.onRequest?.(options.method, url, 0, Date.now() - start);
				throw networkErr;
			} finally {
				if (status > 0) {
					this.onRequest?.(options.method, url, status, Date.now() - start);
				}
			}
		}

		throw lastError ?? new NetworkError("Request failed after all retries");
	}

	private buildUrl(path: string, params?: Record<string, string>): string {
		const url = new URL(path, this.baseUrl);
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

	private createError(status: number, body: string): HyperMemoryError {
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
			case 401:
			case 403:
				return new AuthenticationError(message, status, body);
			case 404:
				return new NotFoundError(message, body);
			case 422:
				return new ValidationError(message, body);
			case 429: {
				const retryAfter = this.parseRetryAfter(body);
				return new RateLimitError(message, retryAfter, 0, 60, body);
			}
			default:
				if (status >= 500) {
					return new ServerError(message, status, body);
				}
				return new HyperMemoryError(message, status, "unknown_error", body);
		}
	}

	private parseRetryAfter(body: string): number {
		try {
			const parsed = JSON.parse(body) as { retry_after?: number };
			if (parsed.retry_after) return parsed.retry_after;
		} catch {
			// Fall through
		}
		return 60;
	}

	private isRetryable(status: number): boolean {
		return status === 429 || status === 503 || status === 502 || status === 504;
	}

	private getBackoffDelay(attempt: number, lastError: Error | null): number {
		if (lastError instanceof RateLimitError && lastError.retryAfter > 0) {
			return lastError.retryAfter * 1000;
		}
		const base = Math.min(1000 * 2 ** (attempt - 1), 30000);
		const jitter = Math.random() * 500;
		return base + jitter;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
