/**
 * Convex hull computation using Andrew's monotone chain algorithm.
 * Used for rendering hyperedge boundaries around groups of nodes.
 */

interface Point {
	x: number;
	y: number;
}

function cross(o: Point, a: Point, b: Point): number {
	return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/**
 * Compute the convex hull of a set of 2D points.
 * Returns points in counter-clockwise order.
 *
 * @param points - Input points (must have at least 3 for a valid hull)
 * @returns Convex hull vertices in CCW order
 */
export function convexHull(points: Point[]): Point[] {
	if (points.length < 3) return [...points];

	const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
	const n = sorted.length;

	const lower: Point[] = [];
	for (let i = 0; i < n; i++) {
		while (
			lower.length >= 2 &&
			cross(lower[lower.length - 2]!, lower[lower.length - 1]!, sorted[i]!) <= 0
		) {
			lower.pop();
		}
		lower.push(sorted[i]!);
	}

	const upper: Point[] = [];
	for (let i = n - 1; i >= 0; i--) {
		while (
			upper.length >= 2 &&
			cross(upper[upper.length - 2]!, upper[upper.length - 1]!, sorted[i]!) <= 0
		) {
			upper.pop();
		}
		upper.push(sorted[i]!);
	}

	lower.pop();
	upper.pop();
	return [...lower, ...upper];
}

/**
 * Create a padded SVG path string from hull points.
 * Expands the hull outward by `padding` pixels for visual clarity.
 *
 * @param hullPoints - Convex hull vertices
 * @param padding - Pixel padding to expand the hull (default: 30)
 * @returns SVG path data string (M...L...Z)
 */
export function paddedHullPath(hullPoints: Point[], padding = 30): string {
	if (hullPoints.length < 2) return "";

	const cx = hullPoints.reduce((s, p) => s + p.x, 0) / hullPoints.length;
	const cy = hullPoints.reduce((s, p) => s + p.y, 0) / hullPoints.length;

	const expanded = hullPoints.map((p) => {
		const dx = p.x - cx;
		const dy = p.y - cy;
		const len = Math.sqrt(dx * dx + dy * dy) || 1;
		return {
			x: p.x + (dx / len) * padding,
			y: p.y + (dy / len) * padding,
		};
	});

	const first = expanded[0]!;
	let path = `M ${first.x} ${first.y}`;
	for (let i = 1; i < expanded.length; i++) {
		path += ` L ${expanded[i]!.x} ${expanded[i]!.y}`;
	}
	path += " Z";
	return path;
}
