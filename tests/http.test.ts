import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	AuthenticationError,
	BadRequestError,
	ForbiddenError,
	HttpClient,
	NetworkError,
	PlanLimitError,
	RateLimitError,
	ServerError,
	TimeoutError,
	ValidationError,
} from "../packages/core/src/index.js";

function createClient(opts?: { maxRetries?: number; timeout?: number; onRequest?: () => void }) {
	return new HttpClient({
		baseUrl: "https://api.test.io",
		apiKey: "hm_test_key",
		maxRetries: opts?.maxRetries ?? 0,
		timeout: opts?.timeout ?? 5000,
		onRequest: opts?.onRequest,
	});
}

function mockResponse(status: number, body: object | string, headers?: Record<string, string>) {
	const h = new Headers(headers);
	return new Response(typeof body === "string" ? body : JSON.stringify(body), {
		status,
		headers: h,
	});
}

describe("HttpClient", () => {
	const fetchMock = vi.fn<typeof fetch>();

	beforeEach(() => {
		vi.stubGlobal("fetch", fetchMock);
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("returns parsed JSON on 200", async () => {
		fetchMock.mockResolvedValueOnce(mockResponse(200, { result: "ok" }));
		const client = createClient();
		const data = await client.request<{ result: string }>({ method: "GET", path: "/test" });
		expect(data.result).toBe("ok");
	});

	it("throws AuthenticationError on 401", async () => {
		fetchMock.mockResolvedValueOnce(mockResponse(401, { detail: "Invalid key" }));
		const client = createClient();
		await expect(client.request({ method: "GET", path: "/test" })).rejects.toBeInstanceOf(
			AuthenticationError,
		);
	});

	it("throws PlanLimitError on 403 with plan field", async () => {
		fetchMock.mockResolvedValueOnce(mockResponse(403, { detail: "Limit exceeded", plan: "free" }));
		const client = createClient();
		const err = await client.request({ method: "GET", path: "/test" }).catch((e) => e);
		expect(err).toBeInstanceOf(PlanLimitError);
		expect(err.plan).toBe("free");
	});

	it("throws ForbiddenError on 403 without plan field", async () => {
		fetchMock.mockResolvedValueOnce(mockResponse(403, { detail: "Not allowed" }));
		const client = createClient();
		await expect(client.request({ method: "GET", path: "/test" })).rejects.toBeInstanceOf(
			ForbiddenError,
		);
	});

	it("throws BadRequestError on 400", async () => {
		fetchMock.mockResolvedValueOnce(mockResponse(400, { detail: "Bad input" }));
		const client = createClient();
		await expect(client.request({ method: "POST", path: "/test" })).rejects.toBeInstanceOf(
			BadRequestError,
		);
	});

	it("throws ValidationError on 422", async () => {
		fetchMock.mockResolvedValueOnce(mockResponse(422, { detail: "Missing field" }));
		const client = createClient();
		await expect(client.request({ method: "POST", path: "/test" })).rejects.toBeInstanceOf(
			ValidationError,
		);
	});

	it("honors Retry-After header on 429", async () => {
		fetchMock
			.mockResolvedValueOnce(mockResponse(429, { detail: "Rate limited" }, { "Retry-After": "7" }))
			.mockResolvedValueOnce(mockResponse(200, { ok: true }));

		const client = createClient({ maxRetries: 1 });
		const promise = client.request({ method: "GET", path: "/test" });

		await vi.advanceTimersByTimeAsync(7000);
		const result = await promise;
		expect(result).toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("throws RateLimitError with retryAfter from header", async () => {
		fetchMock.mockResolvedValueOnce(mockResponse(429, { detail: "slow" }, { "Retry-After": "42" }));
		const client = createClient({ maxRetries: 0 });
		const err: RateLimitError = await client
			.request({ method: "GET", path: "/test" })
			.catch((e) => e);
		expect(err).toBeInstanceOf(RateLimitError);
		expect(err.retryAfter).toBe(42);
	});

	it("does NOT retry POST on 503", async () => {
		fetchMock.mockResolvedValueOnce(mockResponse(503, { detail: "Unavailable" }));
		const client = createClient({ maxRetries: 3 });
		await expect(client.request({ method: "POST", path: "/test" })).rejects.toBeInstanceOf(
			ServerError,
		);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("retries GET on 503 up to maxRetries", async () => {
		fetchMock
			.mockResolvedValueOnce(mockResponse(503, { detail: "Unavailable" }))
			.mockResolvedValueOnce(mockResponse(503, { detail: "Unavailable" }))
			.mockResolvedValueOnce(mockResponse(200, { recovered: true }));

		const client = createClient({ maxRetries: 2 });
		const promise = client.request<{ recovered: boolean }>({ method: "GET", path: "/test" });

		await vi.advanceTimersByTimeAsync(2000);
		await vi.advanceTimersByTimeAsync(5000);
		const data = await promise;
		expect(data.recovered).toBe(true);
		expect(fetchMock).toHaveBeenCalledTimes(3);
	});

	it("throws NetworkError when AbortSignal is aborted", async () => {
		const ac = new AbortController();
		ac.abort();
		fetchMock.mockRejectedValueOnce(new DOMException("Aborted", "AbortError"));
		const client = createClient();
		const err = await client
			.request({ method: "GET", path: "/test", signal: ac.signal })
			.catch((e) => e);
		expect(err).toBeInstanceOf(NetworkError);
		expect(err.message).toBe("Request was cancelled");
	});

	it("throws TimeoutError after maxRetries on timeout", async () => {
		vi.useRealTimers();
		fetchMock.mockImplementation(
			() =>
				new Promise((_, reject) =>
					setTimeout(() => reject(new DOMException("Aborted", "AbortError")), 5),
				),
		);
		const client = createClient({ maxRetries: 1, timeout: 10 });
		await expect(client.request({ method: "GET", path: "/test" })).rejects.toBeInstanceOf(
			TimeoutError,
		);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("calls onRequest exactly once per attempt", async () => {
		const onRequest = vi.fn();
		fetchMock
			.mockResolvedValueOnce(mockResponse(503, { detail: "down" }))
			.mockResolvedValueOnce(mockResponse(200, { ok: true }));

		const client = createClient({ maxRetries: 1, onRequest });
		const promise = client.request({ method: "GET", path: "/test" });
		await vi.advanceTimersByTimeAsync(3000);
		await promise;
		expect(onRequest).toHaveBeenCalledTimes(2);
		expect(onRequest.mock.calls[0][2]).toBe(503);
		expect(onRequest.mock.calls[1][2]).toBe(200);
	});

	it("retries 429 on POST (rate limit means request was not processed)", async () => {
		fetchMock
			.mockResolvedValueOnce(
				mockResponse(429, { detail: "slow", retry_after: 1 }, { "Retry-After": "1" }),
			)
			.mockResolvedValueOnce(mockResponse(200, { ok: true }));

		const client = createClient({ maxRetries: 1 });
		const promise = client.request<{ ok: boolean }>({ method: "POST", path: "/test" });
		await vi.advanceTimersByTimeAsync(1500);
		const data = await promise;
		expect(data.ok).toBe(true);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("sends Authorization header with Bearer token", async () => {
		fetchMock.mockResolvedValueOnce(mockResponse(200, {}));
		const client = createClient();
		await client.request({ method: "GET", path: "/test" });
		const call = fetchMock.mock.calls[0];
		const opts = call[1] as RequestInit;
		expect((opts.headers as Record<string, string>).Authorization).toBe("Bearer hm_test_key");
	});
});
