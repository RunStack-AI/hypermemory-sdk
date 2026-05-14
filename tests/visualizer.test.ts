import { describe, expect, it } from "vitest";
import {
	DEFAULT_3D_CONFIG,
	DEFAULT_SIMULATION,
	NODE_COLORS,
	convexHull,
	getNodeColor,
	paddedHullPath,
} from "../packages/visualizer-core/src/index.js";

describe("Node colors", () => {
	it("has colors for all 20 axiom types", () => {
		const expectedTypes = [
			"person",
			"organization",
			"technology",
			"concept",
			"event",
			"decision",
			"artifact",
			"project",
			"skill",
			"preference",
			"fact",
			"component",
			"location",
			"user",
			"document",
			"process",
			"metric",
			"goal",
			"risk",
			"default",
		];
		for (const type of expectedTypes) {
			expect(NODE_COLORS[type]).toBeDefined();
			expect(NODE_COLORS[type]).toMatch(/^#[0-9A-Fa-f]{6}$/);
		}
	});

	it("getNodeColor returns correct color for known type", () => {
		expect(getNodeColor("person")).toBe("#4FC3F7");
		expect(getNodeColor("technology")).toBe("#FFB74D");
	});

	it("getNodeColor returns default for unknown type", () => {
		expect(getNodeColor("unknown_type")).toBe("#78909C");
	});

	it("getNodeColor respects overrides", () => {
		expect(getNodeColor("person", { person: "#FF0000" })).toBe("#FF0000");
	});
});

describe("Convex hull", () => {
	it("returns empty for less than 3 points", () => {
		expect(convexHull([])).toEqual([]);
		expect(convexHull([{ x: 1, y: 1 }])).toEqual([{ x: 1, y: 1 }]);
	});

	it("computes correct hull for simple triangle", () => {
		const points = [
			{ x: 0, y: 0 },
			{ x: 4, y: 0 },
			{ x: 2, y: 3 },
		];
		const hull = convexHull(points);
		expect(hull).toHaveLength(3);
	});

	it("excludes interior points", () => {
		const points = [
			{ x: 0, y: 0 },
			{ x: 10, y: 0 },
			{ x: 10, y: 10 },
			{ x: 0, y: 10 },
			{ x: 5, y: 5 }, // interior
		];
		const hull = convexHull(points);
		expect(hull).toHaveLength(4);
	});
});

describe("Padded hull path", () => {
	it("returns empty string for less than 2 points", () => {
		expect(paddedHullPath([{ x: 0, y: 0 }])).toBe("");
	});

	it("generates valid SVG path", () => {
		const points = [
			{ x: 0, y: 0 },
			{ x: 10, y: 0 },
			{ x: 10, y: 10 },
			{ x: 0, y: 10 },
		];
		const path = paddedHullPath(points, 5);
		expect(path).toMatch(/^M /);
		expect(path).toContain("L ");
		expect(path).toContain("Z");
	});
});

describe("Simulation configs", () => {
	it("DEFAULT_SIMULATION has expected values", () => {
		expect(DEFAULT_SIMULATION.gravity).toBe(0.15);
		expect(DEFAULT_SIMULATION.repulsion).toBe(6.0);
		expect(DEFAULT_SIMULATION.friction).toBe(0.8);
		expect(DEFAULT_SIMULATION.decay).toBe(1500);
	});

	it("DEFAULT_3D_CONFIG has expected values", () => {
		expect(DEFAULT_3D_CONFIG.backgroundColor).toBe("#1a2332");
		expect(DEFAULT_3D_CONFIG.chargeStrength).toBe(-30);
		expect(DEFAULT_3D_CONFIG.highlightColor).toBe("#FFD700");
	});
});
