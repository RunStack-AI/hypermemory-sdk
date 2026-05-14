"use client";

/**
 * React component wrapping the ForceGraph3DViewer for 3D graph visualization.
 *
 * @example
 * ```tsx
 * import { HyperMemoryGraph3D } from "@runstack-ai/hypermemory-react";
 *
 * <HyperMemoryGraph3D
 *   graphId="graph:abc123"
 *   onNodeClick={(node) => console.log(node)}
 *   style={{ width: "100%", height: "600px" }}
 * />
 * ```
 */

import { type ForceGraph3DOptions, ForceGraph3DViewer } from "@runstack-ai/hypermemory-visualizer-core";
import type { GraphLink, GraphNode } from "@runstack-ai/hypermemory-visualizer-core";
import { type CSSProperties, useEffect, useRef } from "react";
import { useHyperMemory } from "./useHyperMemory.js";

export interface HyperMemoryGraph3DProps {
	/** Public graph ID to auto-fetch data from */
	graphId?: string;
	/** Direct node data (overrides graphId fetch) */
	nodes?: GraphNode[];
	/** Direct link data */
	links?: GraphLink[];
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
	/** CSS class name */
	className?: string;
	/** Inline styles */
	style?: CSSProperties;
}

export function HyperMemoryGraph3D({
	graphId,
	nodes: propNodes,
	links: propLinks,
	showOrphans = true,
	showDocs = true,
	nodeColors,
	backgroundColor,
	onNodeClick,
	className,
	style = { width: "100%", height: "100%", position: "relative" },
}: HyperMemoryGraph3DProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const viewerRef = useRef<ForceGraph3DViewer | null>(null);
	const onNodeClickRef = useRef(onNodeClick);
	const client = useHyperMemory();

	onNodeClickRef.current = onNodeClick;

	useEffect(() => {
		if (!containerRef.current) return;

		const ac = new AbortController();

		const options: ForceGraph3DOptions = {
			showOrphans,
			showDocs,
			nodeColors,
			backgroundColor,
			onNodeClick: (node) => onNodeClickRef.current?.(node),
		};

		const viewer = new ForceGraph3DViewer(containerRef.current, options);
		viewerRef.current = viewer;

		if (propNodes && propLinks) {
			viewer.setData(propNodes, propLinks);
		} else if (graphId) {
			client.getPublicGraph(graphId, { signal: ac.signal }).then(
				(graph) => {
					if (!ac.signal.aborted) viewer.setData(graph.nodes, graph.links);
				},
				(err) => {
					if (!ac.signal.aborted) console.error("[HyperMemoryGraph3D] Failed to fetch graph:", err);
				},
			);
		}

		return () => {
			ac.abort();
			viewer.destroy();
			viewerRef.current = null;
		};
	}, [graphId, propNodes, propLinks, nodeColors, backgroundColor, showOrphans, showDocs, client]);

	return <div ref={containerRef} className={className} style={style} />;
}
