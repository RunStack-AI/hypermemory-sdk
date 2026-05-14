/**
 * ForceGraph3DViewer — Three.js-based 3D graph visualization using 3d-force-graph.
 *
 * Mounts to any DOM element and renders an interactive 3D hypergraph
 * with sphere nodes, neighbor highlighting, and camera fly-to on selection.
 *
 * @example
 * ```typescript
 * import { ForceGraph3DViewer } from "@runstack-ai/hypermemory-visualizer-core";
 *
 * const viewer = new ForceGraph3DViewer(document.getElementById("graph")!, {
 *   onNodeClick: (node) => console.log("Clicked:", node.node_key),
 * });
 *
 * viewer.setData(nodes, links);
 * ```
 */

import { getNodeColor } from "../shared/colors.js";
import type { GraphLink, GraphNode } from "../shared/types.js";
import { DEFAULT_3D_CONFIG, type ForceGraph3DOptions } from "./config.js";

interface Internal3DNode {
	id: string;
	label: string;
	type: string;
	color: string;
	linkCount: number;
	x?: number;
	y?: number;
	z?: number;
}

interface Internal3DLink {
	source: string;
	target: string;
	label: string;
}

export class ForceGraph3DViewer {
	private container: HTMLElement;
	private options: ForceGraph3DOptions;
	private graphInstance: unknown = null;
	private nodes: GraphNode[] = [];
	private links: GraphLink[] = [];
	private showOrphans: boolean;
	private showDocs: boolean;
	private selectedNodeId: string | null = null;
	private neighborSet: Set<string> = new Set();
	private destroyed = false;
	private addedElements: Element[] = [];

	constructor(container: HTMLElement, options: ForceGraph3DOptions = {}) {
		this.container = container;
		this.options = options;
		this.showOrphans = options.showOrphans ?? true;
		this.showDocs = options.showDocs ?? true;
	}

	/**
	 * Set graph data and trigger render.
	 *
	 * @param nodes - Graph nodes
	 * @param links - Graph edges
	 */
	async setData(nodes: GraphNode[], links: GraphLink[]): Promise<void> {
		this.nodes = nodes;
		this.links = links;
		await this.render();
	}

	/**
	 * Filter nodes by search query (highlights matches).
	 *
	 * @param query - Search string to match against node keys and descriptions
	 */
	search(query: string): void {
		const lowerQuery = query.toLowerCase();
		const match = this.nodes.find(
			(n) =>
				n.node_key.toLowerCase().includes(lowerQuery) ||
				n.description.toLowerCase().includes(lowerQuery),
		);
		if (match) {
			this.selectNode(match.node_key);
		}
	}

	/** Select a specific node by ID (highlights neighbors, flies camera to it). */
	selectNode(nodeId: string): void {
		this.selectedNodeId = nodeId;
		this.neighborSet = this.getNeighbors(nodeId);
		this.flyToNode(nodeId);
		this.updateHighlights();
	}

	/** Clear node selection and highlighting. */
	clearSelection(): void {
		this.selectedNodeId = null;
		this.neighborSet.clear();
		this.updateHighlights();
	}

	/** Fit the entire graph into the camera view. */
	fitToScreen(): void {
		if (!this.graphInstance) return;
		const instance = this.graphInstance as { zoomToFit?: (duration?: number) => void };
		if (typeof instance.zoomToFit === "function") {
			instance.zoomToFit(this.options.flyToDuration ?? DEFAULT_3D_CONFIG.flyToDuration);
		}
	}

	/** Pause force simulation. */
	pause(): void {
		if (!this.graphInstance) return;
		const instance = this.graphInstance as { pauseAnimation?: () => void };
		if (typeof instance.pauseAnimation === "function") {
			instance.pauseAnimation();
		}
	}

	/** Resume force simulation. */
	resume(): void {
		if (!this.graphInstance) return;
		const instance = this.graphInstance as { resumeAnimation?: () => void };
		if (typeof instance.resumeAnimation === "function") {
			instance.resumeAnimation();
		}
	}

	/** Register a node click callback. */
	onNodeClick(callback: (node: GraphNode) => void): void {
		this.options.onNodeClick = callback;
	}

	/** Destroy the viewer and free resources. */
	destroy(): void {
		this.destroyed = true;
		if (this.graphInstance) {
			const instance = this.graphInstance as { _destructor?: () => void };
			if (typeof instance._destructor === "function") {
				instance._destructor();
			}
		}
		for (const el of this.addedElements) {
			el.remove();
		}
		this.addedElements = [];
		const renderer = this.container.querySelector("canvas");
		if (renderer) renderer.remove();
		this.graphInstance = null;
	}

	private async render(): Promise<void> {
		if (this.destroyed) return;

		const filteredNodes = this.getFilteredNodes();
		const linkCounts = new Map<string, number>();
		for (const link of this.links) {
			linkCounts.set(link.source, (linkCounts.get(link.source) ?? 0) + 1);
			linkCounts.set(link.target, (linkCounts.get(link.target) ?? 0) + 1);
		}

		const internalNodes: Internal3DNode[] = filteredNodes.map((n) => ({
			id: n.node_key,
			label: n.description,
			type: n.node_type,
			color: getNodeColor(n.node_type, this.options.nodeColors),
			linkCount: linkCounts.get(n.node_key) ?? 0,
		}));

		const nodeIdSet = new Set(internalNodes.map((n) => n.id));
		const internalLinks: Internal3DLink[] = this.links
			.filter((l) => nodeIdSet.has(l.source) && nodeIdSet.has(l.target))
			.map((l) => ({ source: l.source, target: l.target, label: l.relationship }));

		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const ForceGraph3DModule = (await import("3d-force-graph")) as any;
			const ForceGraph3D = ForceGraph3DModule.default;

			if (this.graphInstance) {
				(this.graphInstance as { _destructor?: () => void })._destructor?.();
				const canvas = this.container.querySelector("canvas");
				if (canvas) canvas.remove();
			}

			const bgColor = this.options.backgroundColor ?? DEFAULT_3D_CONFIG.backgroundColor;
			const chargeStrength = this.options.chargeStrength ?? DEFAULT_3D_CONFIG.chargeStrength;
			const linkDistance = this.options.linkDistance ?? DEFAULT_3D_CONFIG.linkDistance;

			const graph = new ForceGraph3D(this.container)
				.graphData({ nodes: internalNodes, links: internalLinks })
				.nodeId("id")
				.nodeLabel("label")
				.nodeColor((node: object) => {
					const n = node as Internal3DNode;
					if (!this.selectedNodeId) return n.color;
					if (n.id === this.selectedNodeId) return DEFAULT_3D_CONFIG.highlightColor;
					if (this.neighborSet.has(n.id)) return n.color;
					return `${n.color}44`;
				})
				.nodeVal((node: object) => {
					const n = node as Internal3DNode;
					const base = DEFAULT_3D_CONFIG.nodeBaseSize;
					const scale = Math.min(n.linkCount * 0.5, DEFAULT_3D_CONFIG.nodeMaxSize - base);
					return base + scale;
				})
				.linkColor(() => "#ffffff30")
				.linkWidth(0.5)
				.backgroundColor(bgColor)
				.onNodeClick((node: object) => {
					const n = node as Internal3DNode;
					if (this.options.onNodeClick) {
						const original = this.nodes.find((orig) => orig.node_key === n.id);
						if (original) this.options.onNodeClick(original);
					}
					this.selectNode(n.id);
				});

			graph.d3Force("charge")?.strength(chargeStrength);
			graph.d3Force("link")?.distance(linkDistance);

			this.graphInstance = graph;
		} catch {
			this.renderFallback();
		}
	}

	private getFilteredNodes(): GraphNode[] {
		const connectedIds = new Set<string>();
		for (const link of this.links) {
			connectedIds.add(link.source);
			connectedIds.add(link.target);
		}

		return this.nodes.filter((node) => {
			if (!this.showOrphans && !connectedIds.has(node.node_key)) return false;
			if (!this.showDocs && node.node_type === "document") return false;
			return true;
		});
	}

	private getNeighbors(nodeId: string): Set<string> {
		const neighbors = new Set<string>();
		for (const link of this.links) {
			if (link.source === nodeId) neighbors.add(link.target);
			if (link.target === nodeId) neighbors.add(link.source);
		}
		return neighbors;
	}

	private flyToNode(nodeId: string): void {
		if (!this.graphInstance) return;
		const instance = this.graphInstance as {
			cameraPosition?: (
				pos: { x: number; y: number; z: number },
				lookAt?: unknown,
				transitionMs?: number,
			) => void;
			graphData?: () => { nodes: Internal3DNode[] };
		};
		if (typeof instance.cameraPosition !== "function" || typeof instance.graphData !== "function")
			return;

		const data = instance.graphData();
		const node = data.nodes.find((n) => n.id === nodeId);
		if (!node || node.x == null || node.y == null || node.z == null) return;

		const distance = 120;
		instance.cameraPosition(
			{ x: node.x + distance, y: node.y + distance * 0.5, z: node.z + distance },
			node,
			this.options.flyToDuration ?? DEFAULT_3D_CONFIG.flyToDuration,
		);
	}

	private updateHighlights(): void {
		if (!this.graphInstance) return;
		const instance = this.graphInstance as {
			nodeColor?: (fn: (node: Internal3DNode) => string) => unknown;
		};
		if (typeof instance.nodeColor === "function") {
			instance.nodeColor((node: Internal3DNode) => {
				if (!this.selectedNodeId) return node.color;
				if (node.id === this.selectedNodeId) return DEFAULT_3D_CONFIG.highlightColor;
				if (this.neighborSet.has(node.id)) return node.color;
				return `${node.color}44`;
			});
		}
	}

	private renderFallback(): void {
		const msg = document.createElement("div");
		msg.style.cssText =
			"display:flex;align-items:center;justify-content:center;height:100%;color:#888;font-family:sans-serif;";
		msg.textContent = "Install 3d-force-graph and three to enable 3D graph visualization";
		this.container.appendChild(msg);
		this.addedElements.push(msg);
	}
}
