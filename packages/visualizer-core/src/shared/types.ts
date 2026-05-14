/** Node in the graph visualization. */
export interface GraphNode {
	/** Unique node identifier */
	node_key: string;
	/** Human-readable label/description */
	description: string;
	/** Semantic type (determines color) */
	node_type: string;
	/** Computed x position (set by layout engine) */
	x?: number;
	/** Computed y position (set by layout engine) */
	y?: number;
	/** Computed z position (3D only) */
	z?: number;
}

/** Edge between two nodes. */
export interface GraphLink {
	/** Source node key */
	source: string;
	/** Target node key */
	target: string;
	/** Relationship label */
	relationship: string;
}

/** Hyperedge hull — groups multiple nodes under a shared concept. */
export interface HyperedgeHull {
	/** Hyperedge identifier */
	id: string;
	/** Display label */
	label: string;
	/** Node keys contained in this hyperedge */
	members: string[];
	/** Optional color override */
	color?: string;
}

/** Shared viewer options applicable to all visualizer types. */
export interface BaseViewerOptions {
	/** Background color (CSS string) */
	backgroundColor?: string;
	/** Whether to show orphan nodes (no connections) */
	showOrphans?: boolean;
	/** Whether to show document-type nodes */
	showDocs?: boolean;
	/** Custom node color mapping (node_type → hex color) */
	nodeColors?: Record<string, string>;
	/** Callback when a node is clicked */
	onNodeClick?: (node: GraphNode) => void;
}
