/** Cosmograph simulation parameters matching the production HyperMemory visualizer. */
export interface CosmographSimulationConfig {
	gravity: number;
	repulsion: number;
	theta: number;
	clusterStrength: number;
	springLength: number;
	springCoefficient: number;
	friction: number;
	decay: number;
}

/** Default simulation parameters tuned for knowledge graph layouts. */
export const DEFAULT_SIMULATION: CosmographSimulationConfig = {
	gravity: 0.15,
	repulsion: 6.0,
	theta: 0.25,
	clusterStrength: 0.6,
	springLength: 38,
	springCoefficient: 0.12,
	friction: 0.8,
	decay: 1500,
};

/** Configuration options for the CosmographViewer. */
export interface CosmographViewerOptions {
	/** Background color */
	backgroundColor?: string;
	/** Whether to show hyperedge hulls */
	showHyperedges?: boolean;
	/** Whether to show orphan nodes */
	showOrphans?: boolean;
	/** Whether to show document-type nodes */
	showDocs?: boolean;
	/** Custom node color mapping */
	nodeColors?: Record<string, string>;
	/** Simulation parameter overrides */
	simulation?: Partial<CosmographSimulationConfig>;
	/** Node click callback */
	onNodeClick?: (node: { node_key: string; description: string; node_type: string }) => void;
	/** Hyperedge hull click callback */
	onHullClick?: (hull: { id: string; label: string; members: string[] }) => void;
}
