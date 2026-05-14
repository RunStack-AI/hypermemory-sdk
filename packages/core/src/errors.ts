/**
 * Typed error hierarchy for the HyperMemory SDK.
 * All errors extend HyperMemoryError and carry HTTP status + machine-readable code.
 */

/** Base error for all HyperMemory API failures. */
export class HyperMemoryError extends Error {
	/** HTTP status code from the API response */
	readonly status: number;
	/** Machine-readable error code */
	readonly code: string;
	/** Raw response body as returned by the server (may be JSON-as-string or plain text).
	 *  Treat as opaque — log it, but don't parse it for control flow; use `code` instead. */
	readonly body?: string;

	constructor(message: string, status: number, code: string, body?: string) {
		super(message);
		this.name = "HyperMemoryError";
		this.status = status;
		this.code = code;
		this.body = body;
	}
}

/** 400 — malformed request. */
export class BadRequestError extends HyperMemoryError {
	constructor(message: string, body?: string) {
		super(message, 400, "bad_request", body);
		this.name = "BadRequestError";
	}
}

/** 401 — invalid or expired API key. */
export class AuthenticationError extends HyperMemoryError {
	constructor(message: string, status = 401, body?: string) {
		super(message, status, "authentication_error", body);
		this.name = "AuthenticationError";
	}
}

/** 403 — insufficient permissions for this resource or action. */
export class ForbiddenError extends HyperMemoryError {
	constructor(message: string, body?: string) {
		super(message, 403, "forbidden", body);
		this.name = "ForbiddenError";
	}
}

/** 404 — requested resource does not exist. */
export class NotFoundError extends HyperMemoryError {
	constructor(message: string, body?: string) {
		super(message, 404, "not_found", body);
		this.name = "NotFoundError";
	}
}

/** 429 — rate limit exceeded. Includes retry timing information. */
export class RateLimitError extends HyperMemoryError {
	/** Seconds until the rate limit resets */
	readonly retryAfter: number;
	/** Requests allowed in the window */
	readonly limit: number;
	/** Window size in seconds */
	readonly windowSeconds: number;

	constructor(message: string, retryAfter: number, limit = 0, windowSeconds = 60, body?: string) {
		super(message, 429, "rate_limit_exceeded", body);
		this.name = "RateLimitError";
		this.retryAfter = retryAfter;
		this.limit = limit;
		this.windowSeconds = windowSeconds;
	}
}

/** 422 — request body validation failed. */
export class ValidationError extends HyperMemoryError {
	constructor(message: string, body?: string) {
		super(message, 422, "validation_error", body);
		this.name = "ValidationError";
	}
}

/** 500+ — unexpected server-side error. */
export class ServerError extends HyperMemoryError {
	constructor(message: string, status = 500, body?: string) {
		super(message, status, "server_error", body);
		this.name = "ServerError";
	}
}

/** Network error — request never reached the server or timed out. */
export class NetworkError extends HyperMemoryError {
	constructor(message: string) {
		super(message, 0, "network_error");
		this.name = "NetworkError";
	}
}

/** Request timed out. */
export class TimeoutError extends HyperMemoryError {
	constructor(timeoutMs: number) {
		super(`Request timed out after ${timeoutMs}ms`, 0, "timeout");
		this.name = "TimeoutError";
	}
}

/** Plan limit exceeded (monthly cap or per-tool limit). */
export class PlanLimitError extends HyperMemoryError {
	/** The plan tier that was exceeded */
	readonly plan: string;

	constructor(message: string, plan: string, body?: string) {
		super(message, 403, "plan_limit_exceeded", body);
		this.name = "PlanLimitError";
		this.plan = plan;
	}
}
