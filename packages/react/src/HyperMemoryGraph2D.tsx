"use client";

/**
 * React component wrapping the CosmographViewer for 2D graph visualization.
 *
 * @example
 * ```tsx
 * import { HyperMemoryGraph2D } from "@hypermemory/react";
 *
 * <HyperMemoryGraph2D
 *   graphId="graph:abc123"
 *   showHyperedges={true}
 *   onNodeClick={(node) => console.log(node)}
 *   onHullClick={(hull) => console.log(hull)}
 *   style={{ width: "100%", height: "600px" }}
 * />
 * ```
 */

import { CosmographViewer, type CosmographViewerOptions } from "@hypermemory/visualizer-core";
import type { GraphLink, GraphNode, HyperedgeHull } from "@hypermemory/visualizer-core";
import { type CSSProperties, useEffect, useRef } from "react";
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
	const onNodeClickRef = useRef(onNodeClick);
	const onHullClickRef = useRef(onHullClick);
	const client = useHyperMemory();

	onNodeClickRef.current = onNodeClick;
	onHullClickRef.current = onHullClick;

	useEffect(() => {
		if (!containerRef.current) return;

		const ac = new AbortController();

		const options: CosmographViewerOptions = {
			showHyperedges,
			showOrphans,
			showDocs,
			nodeColors,
			backgroundColor,
			onNodeClick: (node) => onNodeClickRef.current?.(node),
			onHullClick: (hull) => onHullClickRef.current?.(hull),
		};

		const viewer = new CosmographViewer(containerRef.current, options);
		viewerRef.current = viewer;

		if (propNodes && propLinks) {
			viewer.setData(propNodes, propLinks, propHyperedges ?? []);
		} else if (graphId) {
			client.getPublicGraph(graphId, { signal: ac.signal }).then(
				(graph) => {
					if (!ac.signal.aborted) viewer.setData(graph.nodes, graph.links);
				},
				(err) => {
					if (!ac.signal.aborted) console.error("[HyperMemoryGraph2D] Failed to fetch graph:", err);
				},
			);
		}

		return () => {
			ac.abort();
			viewer.destroy();
			viewerRef.current = null;
		};
	}, [
		graphId,
		propNodes,
		propLinks,
		propHyperedges,
		nodeColors,
		backgroundColor,
		showHyperedges,
		showOrphans,
		showDocs,
		client,
	]);

	return <div ref={containerRef} className={className} style={style} />;
}
