/**
 * CosmographViewer — GPU-accelerated 2D graph visualization using Cosmograph.
 *
 * Mounts to any DOM element and renders an interactive hypergraph
 * with force-directed layout, hyperedge hull rendering, and node filtering.
 *
 * @example
 * ```typescript
 * import { CosmographViewer } from "@hypermemory/visualizer-core";
 *
 * const viewer = new CosmographViewer(document.getElementById("graph")!, {
 *   showHyperedges: false,
 *   onNodeClick: (node) => console.log("Clicked:", node.node_key),
 * });
 *
 * viewer.setData(nodes, links, hyperedges);
 * ```
 */

import { getNodeColor } from "../shared/colors.js";
import type { GraphLink, GraphNode, HyperedgeHull } from "../shared/types.js";
import { type CosmographViewerOptions, DEFAULT_SIMULATION } from "./config.js";
import { convexHull, paddedHullPath } from "./hull.js";

interface InternalNode {
	id: string;
	label: string;
	type: string;
	color: string;
	x?: number;
	y?: number;
}

interface InternalLink {
	source: string;
	target: string;
	label: string;
}

export class CosmographViewer {
	private container: HTMLElement;
	private options: CosmographViewerOptions;
	private cosmographInstance: unknown = null;
	private canvas: HTMLCanvasElement | null = null;
	private nodes: GraphNode[] = [];
	private links: GraphLink[] = [];
	private hyperedges: HyperedgeHull[] = [];
	private showHyperedges: boolean;
	private showOrphans: boolean;
	private showDocs: boolean;
	private destroyed = false;

	constructor(container: HTMLElement, options: CosmographViewerOptions = {}) {
		this.container = container;
		this.options = options;
		this.showHyperedges = options.showHyperedges ?? false;
		this.showOrphans = options.showOrphans ?? true;
		this.showDocs = options.showDocs ?? true;
	}

	/**
	 * Set graph data and trigger render.
	 *
	 * @param nodes - Graph nodes
	 * @param links - Graph edges
	 * @param hyperedges - Optional hyperedge hull definitions
	 */
	async setData(nodes: GraphNode[], links: GraphLink[], hyperedges: HyperedgeHull[] = []): Promise<void> {
		this.nodes = nodes;
		this.links = links;
		this.hyperedges = hyperedges;
		await this.render();
	}

	/**
	 * Filter nodes by search query (highlights matches, dims others).
	 *
	 * @param query - Search string to match against node keys and descriptions
	 */
	search(query: string): void {
		if (!this.cosmographInstance) return;
		const lowerQuery = query.toLowerCase();
		const matchingIds = this.nodes
			.filter(
				(n) =>
					n.node_key.toLowerCase().includes(lowerQuery) ||
					n.description.toLowerCase().includes(lowerQuery),
			)
			.map((n) => n.node_key);

		this.highlightNodes(matchingIds);
	}

	/** Select a specific node by ID (centers and highlights). */
	selectNode(nodeId: string): void {
		this.highlightNodes([nodeId]);
	}

	/** Clear all selection/highlighting. */
	clearSelection(): void {
		this.highlightNodes(null);
	}

	/** Toggle hyperedge hull rendering. */
	toggleHyperedges(show: boolean): void {
		this.showHyperedges = show;
		this.renderHulls();
	}

	/** Toggle orphan node visibility. */
	toggleOrphans(show: boolean): void {
		this.showOrphans = show;
		this.render();
	}

	/** Toggle document-type node visibility. */
	toggleDocs(show: boolean): void {
		this.showDocs = show;
		this.render();
	}

	/** Fit the graph to fill the viewport. */
	fitView(): void {
		if (this.cosmographInstance && typeof (this.cosmographInstance as { fitView?: () => void }).fitView === "function") {
			(this.cosmographInstance as { fitView: () => void }).fitView();
		}
	}

	/** Pause the simulation. */
	pause(): void {
		if (this.cosmographInstance && typeof (this.cosmographInstance as { pause?: () => void }).pause === "function") {
			(this.cosmographInstance as { pause: () => void }).pause();
		}
	}

	/** Resume the simulation. */
	resume(): void {
		if (this.cosmographInstance && typeof (this.cosmographInstance as { restart?: () => void }).restart === "function") {
			(this.cosmographInstance as { restart: () => void }).restart();
		}
	}

	/** Register a node click callback. */
	onNodeClick(callback: (node: GraphNode) => void): void {
		this.options.onNodeClick = callback;
	}

	/** Register a hull click callback. */
	onHullClick(callback: (hull: HyperedgeHull) => void): void {
		this.options.onHullClick = callback;
	}

	/** Destroy the viewer and free resources. */
	destroy(): void {
		this.destroyed = true;
		if (this.cosmographInstance && typeof (this.cosmographInstance as { destroy?: () => void }).destroy === "function") {
			(this.cosmographInstance as { destroy: () => void }).destroy();
		}
		if (this.canvas) {
			this.canvas.remove();
			this.canvas = null;
		}
		this.cosmographInstance = null;
	}

	private async render(): Promise<void> {
		if (this.destroyed) return;

		const filteredNodes = this.getFilteredNodes();
		const connectedNodeIds = new Set<string>();
		for (const link of this.links) {
			connectedNodeIds.add(link.source);
			connectedNodeIds.add(link.target);
		}

		const internalNodes: InternalNode[] = filteredNodes.map((n) => ({
			id: n.node_key,
			label: n.description,
			type: n.node_type,
			color: getNodeColor(n.node_type, this.options.nodeColors),
		}));

		const nodeIdSet = new Set(internalNodes.map((n) => n.id));
		const internalLinks: InternalLink[] = this.links
			.filter((l) => nodeIdSet.has(l.source) && nodeIdSet.has(l.target))
			.map((l) => ({ source: l.source, target: l.target, label: l.relationship }));

		try {
			// Dynamic import — Cosmograph is an optional peer dependency
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const cosmographModule = await import("@cosmograph/cosmograph") as any;
			const Cosmograph = cosmographModule.Cosmograph;

			if (this.cosmographInstance) {
				(this.cosmographInstance as { destroy: () => void }).destroy();
			}

			const sim = { ...DEFAULT_SIMULATION, ...this.options.simulation };

			// Cosmograph v2 uses columnar config with data passed as Record<string,unknown>[]
			const config = {
				points: internalNodes as unknown as Record<string, unknown>[],
				pointId: "id",
				pointColor: "color",
				pointSize: 4,
				links: internalLinks as unknown as Record<string, unknown>[],
				linkSource: "source",
				linkTarget: "target",
				linkWidth: 1,
				linkColor: "#ffffff20",
				backgroundColor: this.options.backgroundColor ?? "#1a1a2e",
				simulationGravity: sim.gravity,
				simulationRepulsion: sim.repulsion,
				simulationRepulsionTheta: sim.theta,
				simulationFriction: sim.friction,
				simulationDecay: sim.decay,
				simulationLinkSpring: sim.springCoefficient,
				simulationLinkDistance: sim.springLength,
				onClick: (index: number | undefined) => {
					if (index !== undefined && this.options.onNodeClick) {
						const original = this.nodes[index];
						if (original) this.options.onNodeClick(original);
					}
				},
			};

			this.cosmographInstance = new Cosmograph(this.container, config);
		} catch {
			this.renderFallback(internalNodes, internalLinks);
		}

		this.renderHulls();
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

	private renderHulls(): void {
		const existingOverlay = this.container.querySelector(".hm-hull-overlay");
		if (existingOverlay) existingOverlay.remove();

		if (!this.showHyperedges || this.hyperedges.length === 0) return;

		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.classList.add("hm-hull-overlay");
		svg.style.position = "absolute";
		svg.style.top = "0";
		svg.style.left = "0";
		svg.style.width = "100%";
		svg.style.height = "100%";
		svg.style.pointerEvents = "none";
		svg.style.zIndex = "1";

		for (const hull of this.hyperedges) {
			const memberNodes = this.nodes.filter((n) => hull.members.includes(n.node_key));
			if (memberNodes.length < 2) continue;

			const points = memberNodes
				.filter((n) => n.x !== undefined && n.y !== undefined)
				.map((n) => ({ x: n.x!, y: n.y! }));

			if (points.length < 2) continue;

			const hullPoints = convexHull(points);
			const pathData = paddedHullPath(hullPoints, 30);

			const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
			path.setAttribute("d", pathData);
			path.setAttribute("fill", (hull.color ?? "#ffffff") + "15");
			path.setAttribute("stroke", hull.color ?? "#ffffff40");
			path.setAttribute("stroke-width", "1.5");
			svg.appendChild(path);
		}

		this.container.appendChild(svg);
	}

	private highlightNodes(nodeIds: string[] | null): void {
		// Highlighting is handled by Cosmograph's built-in selection API
		if (!this.cosmographInstance) return;
		const instance = this.cosmographInstance as {
			selectNodes?: (ids: string[] | null) => void;
		};
		if (typeof instance.selectNodes === "function") {
			instance.selectNodes(nodeIds);
		}
	}

	private renderFallback(_nodes: InternalNode[], _links: InternalLink[]): void {
		const msg = document.createElement("div");
		msg.style.cssText =
			"display:flex;align-items:center;justify-content:center;height:100%;color:#888;font-family:sans-serif;";
		msg.textContent = "Install @cosmograph/cosmograph to enable 2D graph visualization";
		this.container.appendChild(msg);
	}
}
