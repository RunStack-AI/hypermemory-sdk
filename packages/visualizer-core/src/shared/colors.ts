/**
 * Default node color palette — 20 axiom types mapped to distinct hex colors.
 * These match the production HyperMemory visualizer.
 */
export const NODE_COLORS: Record<string, string> = {
	person: "#4FC3F7",
	organization: "#81C784",
	technology: "#FFB74D",
	concept: "#BA68C8",
	event: "#F06292",
	decision: "#FF8A65",
	artifact: "#A1887F",
	project: "#4DB6AC",
	skill: "#7986CB",
	preference: "#DCE775",
	fact: "#90A4AE",
	component: "#FFD54F",
	location: "#AED581",
	user: "#4DD0E1",
	document: "#B0BEC5",
	process: "#CE93D8",
	metric: "#FFF176",
	goal: "#80CBC4",
	risk: "#EF5350",
	default: "#78909C",
};

/**
 * Get the color for a node type, falling back to the default gray.
 *
 * @param nodeType - The node's semantic type
 * @param overrides - Optional custom color mapping
 * @returns Hex color string
 */
export function getNodeColor(nodeType: string, overrides?: Record<string, string>): string {
	if (overrides?.[nodeType]) return overrides[nodeType];
	return NODE_COLORS[nodeType] ?? NODE_COLORS.default ?? "#78909C";
}
