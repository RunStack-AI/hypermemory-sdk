import { describe, expect, it } from "vitest";
import {
	HyperMemoryClient,
	HyperMemoryError,
	AuthenticationError,
	NotFoundError,
	RateLimitError,
	ValidationError,
	ServerError,
	NetworkError,
	TimeoutError,
	PlanLimitError,
} from "../packages/core/src/index.js";

describe("HyperMemoryClient", () => {
	it("throws if apiKey is empty", () => {
		expect(() => new HyperMemoryClient({ apiKey: "" })).toThrow("apiKey is required");
	});

	it("constructs with valid apiKey", () => {
		const client = new HyperMemoryClient({ apiKey: "hm_test_key" });
		expect(client).toBeInstanceOf(HyperMemoryClient);
	});

	it("uses default baseUrl", () => {
		const client = new HyperMemoryClient({ apiKey: "hm_test" });
		expect(client).toBeDefined();
	});

	it("accepts custom options", () => {
		const client = new HyperMemoryClient({
			apiKey: "hm_test",
			baseUrl: "https://custom.api.com",
			maxRetries: 5,
			timeout: 60000,
		});
		expect(client).toBeDefined();
	});

	it("getRateLimit returns null before any request", () => {
		const client = new HyperMemoryClient({ apiKey: "hm_test" });
		expect(client.getRateLimit()).toBeNull();
	});
});

describe("Error hierarchy", () => {
	it("HyperMemoryError is the base class", () => {
		const err = new HyperMemoryError("test", 400, "test_code");
		expect(err).toBeInstanceOf(Error);
		expect(err.status).toBe(400);
		expect(err.code).toBe("test_code");
		expect(err.name).toBe("HyperMemoryError");
	});

	it("AuthenticationError carries status", () => {
		const err = new AuthenticationError("forbidden", 403);
		expect(err).toBeInstanceOf(HyperMemoryError);
		expect(err.status).toBe(403);
		expect(err.code).toBe("authentication_error");
	});

	it("NotFoundError is always 404", () => {
		const err = new NotFoundError("gone");
		expect(err.status).toBe(404);
	});

	it("RateLimitError carries retry info", () => {
		const err = new RateLimitError("slow down", 30, 100, 60);
		expect(err.status).toBe(429);
		expect(err.retryAfter).toBe(30);
		expect(err.limit).toBe(100);
		expect(err.windowSeconds).toBe(60);
	});

	it("ValidationError is always 422", () => {
		const err = new ValidationError("bad input");
		expect(err.status).toBe(422);
	});

	it("ServerError defaults to 500", () => {
		const err = new ServerError("crash");
		expect(err.status).toBe(500);
	});

	it("NetworkError has status 0", () => {
		const err = new NetworkError("offline");
		expect(err.status).toBe(0);
	});

	it("TimeoutError has descriptive message", () => {
		const err = new TimeoutError(5000);
		expect(err.message).toBe("Request timed out after 5000ms");
	});

	it("PlanLimitError carries plan info", () => {
		const err = new PlanLimitError("Monthly limit", "free");
		expect(err.status).toBe(403);
		expect(err.plan).toBe("free");
		expect(err.code).toBe("plan_limit_exceeded");
	});
});
