/** Configuration options for the ForceGraph3DViewer. */
export interface ForceGraph3DOptions {
	/** Background color (hex string) */
	backgroundColor?: string;
	/** Whether to show orphan nodes */
	showOrphans?: boolean;
	/** Whether to show document-type nodes */
	showDocs?: boolean;
	/** Custom node color mapping */
	nodeColors?: Record<string, string>;
	/** Force simulation charge strength (default: -30) */
	chargeStrength?: number;
	/** Force simulation link distance (default: 25) */
	linkDistance?: number;
	/** Node click callback */
	onNodeClick?: (node: { node_key: string; description: string; node_type: string }) => void;
	/** Whether to show link labels on hover (default: false) */
	showLinkLabels?: boolean;
	/** Camera fly-to animation duration in ms (default: 1000) */
	flyToDuration?: number;
}

/** Default 3D force graph configuration. */
export const DEFAULT_3D_CONFIG = {
	backgroundColor: "#1a2332",
	chargeStrength: -30,
	linkDistance: 25,
	highlightColor: "#FFD700",
	flyToDuration: 1000,
	nodeBaseSize: 4,
	nodeMaxSize: 12,
} as const;
