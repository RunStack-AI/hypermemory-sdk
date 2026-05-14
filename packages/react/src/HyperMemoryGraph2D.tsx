/**
 * React component wrapping the CosmographViewer for 2D graph visualization.
 *
 * @example
 * ```tsx
 * import { HyperMemoryGraph2D } from "@hypermemory/react";
 *
 * <HyperMemoryGraph2D
 *   graphId="graph:abc123"
 *   showHyperedges={false}
 *   onNodeClick={(node) => console.log(node)}
 *   style={{ width: "100%", height: "600px" }}
 * />
 * ```
 */

import { useEffect, useRef, type CSSProperties } from "react";
import { CosmographViewer, type CosmographViewerOptions } from "@hypermemory/visualizer-core";
import type { GraphNode, GraphLink, HyperedgeHull } from "@hypermemory/visualizer-core";
import { useHyperMemory } from "./useHyperMemory.js";

export interface HyperMemoryGraph2DProps {
	/** Public graph ID to auto-fetch data from */
	graphId?: string;
	/** Direct node data (overrides graphId fetch) */
	nodes?: GraphNode[];
	/** Direct link data */
	links?: GraphLink[];
	/** Hyperedge hull definitions */
	hyperedges?: HyperedgeHull[];
	/** Show hyperedge hulls (default: false) */
	showHyperedges?: boolean;
	/** Show orphan nodes (default: true) */
	showOrphans?: boolean;
	/** Show document nodes (default: true) */
	showDocs?: boolean;
	/** Custom node color mapping */
	nodeColors?: Record<string, string>;
	/** Background color */
	backgroundColor?: string;
	/** Node click callback */
	onNodeClick?: (node: GraphNode) => void;
	/** Hull click callback */
	onHullClick?: (hull: HyperedgeHull) => void;
	/** CSS class name */
	className?: string;
	/** Inline styles */
	style?: CSSProperties;
}

export function HyperMemoryGraph2D({
	graphId,
	nodes: propNodes,
	links: propLinks,
	hyperedges: propHyperedges,
	showHyperedges = false,
	showOrphans = true,
	showDocs = true,
	nodeColors,
	backgroundColor,
	onNodeClick,
	onHullClick,
	className,
	style = { width: "100%", height: "100%", position: "relative" },
}: HyperMemoryGraph2DProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const viewerRef = useRef<CosmographViewer | null>(null);
	const client = useHyperMemory();

	useEffect(() => {
		if (!containerRef.current) return;

		const options: CosmographViewerOptions = {
			showHyperedges,
			showOrphans,
			showDocs,
			nodeColors,
			backgroundColor,
			onNodeClick,
			onHullClick,
		};

		const viewer = new CosmographViewer(containerRef.current, options);
		viewerRef.current = viewer;

		if (propNodes && propLinks) {
			viewer.setData(propNodes, propLinks, propHyperedges ?? []);
		} else if (graphId) {
			client.getPublicGraph(graphId).then(
				(graph) => viewer.setData(graph.nodes, graph.links),
				(err) => console.error("[HyperMemoryGraph2D] Failed to fetch graph:", err),
			);
		}

		return () => {
			viewer.destroy();
			viewerRef.current = null;
		};
	}, [graphId, propNodes, propLinks, propHyperedges, nodeColors, backgroundColor, client]);

	useEffect(() => {
		viewerRef.current?.toggleHyperedges(showHyperedges);
	}, [showHyperedges]);

	useEffect(() => {
		viewerRef.current?.toggleOrphans(showOrphans);
	}, [showOrphans]);

	useEffect(() => {
		viewerRef.current?.toggleDocs(showDocs);
	}, [showDocs]);

	return <div ref={containerRef} className={className} style={style} />;
}
