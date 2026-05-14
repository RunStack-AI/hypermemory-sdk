import { describe, expect, it } from "vitest";

describe("Package exports (built artifacts)", () => {
	it("@hypermemory/core exports HyperMemoryClient from built path", async () => {
		const mod = await import("../packages/core/dist/index.js");
		expect(mod.HyperMemoryClient).toBeDefined();
		expect(typeof mod.HyperMemoryClient).toBe("function");
	});

	it("@hypermemory/core exports all error classes from built path", async () => {
		const mod = await import("../packages/core/dist/index.js");
		expect(mod.AuthenticationError).toBeDefined();
		expect(mod.BadRequestError).toBeDefined();
		expect(mod.ForbiddenError).toBeDefined();
		expect(mod.NotFoundError).toBeDefined();
		expect(mod.RateLimitError).toBeDefined();
		expect(mod.ValidationError).toBeDefined();
		expect(mod.ServerError).toBeDefined();
		expect(mod.NetworkError).toBeDefined();
		expect(mod.TimeoutError).toBeDefined();
		expect(mod.PlanLimitError).toBeDefined();
	});

	it("@hypermemory/visualizer-core exports viewers from built path", async () => {
		const mod = await import("../packages/visualizer-core/dist/index.js");
		expect(mod.CosmographViewer).toBeDefined();
		expect(mod.ForceGraph3DViewer).toBeDefined();
		expect(mod.getNodeColor).toBeDefined();
	});
});
