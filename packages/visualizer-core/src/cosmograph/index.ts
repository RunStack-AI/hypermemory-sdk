/**
 * CosmographViewer — GPU-accelerated 2D graph visualization using Cosmograph.
 *
 * Mounts to any DOM element and renders an interactive hypergraph
 * with force-directed layout and node filtering.
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

interface InternalNode {
	id: string;
	label: string;
	type: string;
	color: string;
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
	private nodes: GraphNode[] = [];
	private links: GraphLink[] = [];
	private currentInternalNodes: InternalNode[] = [];
	private showOrphans: boolean;
	private showDocs: boolean;
	private destroyed = false;
	private renderSeq = 0;
	private addedElements: Element[] = [];

	constructor(container: HTMLElement, options: CosmographViewerOptions = {}) {
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
	 * @param hyperedges - Optional hyperedge hull definitions
	 */
	async setData(
		nodes: GraphNode[],
		links: GraphLink[],
		_hyperedges?: HyperedgeHull[],
	): Promise<void> {
		this.nodes = nodes;
		this.links = links;
		const seq = ++this.renderSeq;
		await this.render(seq);
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

	/** Toggle hyperedge hull rendering (v0.2 — currently a no-op, hulls require frame-synced canvas). */
	toggleHyperedges(_show: boolean): void {
		// Hull rendering requires frame-synced canvas overlay — planned for v0.2
	}

	/** Toggle orphan node visibility. */
	toggleOrphans(show: boolean): void {
		this.showOrphans = show;
		const seq = ++this.renderSeq;
		this.render(seq);
	}

	/** Toggle document-type node visibility. */
	toggleDocs(show: boolean): void {
		this.showDocs = show;
		const seq = ++this.renderSeq;
		this.render(seq);
	}

	/** Fit the graph to fill the viewport. */
	fitView(): void {
		if (!this.cosmographInstance) return;
		const instance = this.cosmographInstance as { fitView?: () => void };
		instance.fitView?.();
	}

	/** Pause the simulation. */
	pause(): void {
		if (!this.cosmographInstance) return;
		const instance = this.cosmographInstance as { pause?: () => void };
		instance.pause?.();
	}

	/** Resume the simulation. */
	resume(): void {
		if (!this.cosmographInstance) return;
		const instance = this.cosmographInstance as { start?: () => void };
		instance.start?.();
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
		if (this.cosmographInstance) {
			const instance = this.cosmographInstance as { destroy?: () => void };
			instance.destroy?.();
		}
		for (const el of this.addedElements) {
			el.remove();
		}
		this.addedElements = [];
		this.cosmographInstance = null;
	}

	private async render(seq: number): Promise<void> {
		if (this.destroyed) return;

		const filteredNodes = this.getFilteredNodes();

		const internalNodes: InternalNode[] = filteredNodes.map((n) => ({
			id: n.node_key,
			label: n.description,
			type: n.node_type,
			color: getNodeColor(n.node_type, this.options.nodeColors),
		}));

		this.currentInternalNodes = internalNodes;

		const nodeIdSet = new Set(internalNodes.map((n) => n.id));
		const internalLinks: InternalLink[] = this.links
			.filter((l) => nodeIdSet.has(l.source) && nodeIdSet.has(l.target))
			.map((l) => ({ source: l.source, target: l.target, label: l.relationship }));

		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const cosmographModule = (await import("@cosmograph/cosmograph")) as any;
			const Cosmograph = cosmographModule.Cosmograph;

			if (seq !== this.renderSeq) return;

			if (this.cosmographInstance) {
				(this.cosmographInstance as { destroy: () => void }).destroy();
			}

			const sim = { ...DEFAULT_SIMULATION, ...this.options.simulation };

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
						const internalNode = this.currentInternalNodes[index];
						if (internalNode) {
							const original = this.nodes.find((n) => n.node_key === internalNode.id);
							if (original) this.options.onNodeClick(original);
						}
					}
				},
			};

			this.cosmographInstance = new Cosmograph(this.container, config);
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

	private highlightNodes(nodeIds: string[] | null): void {
		if (!this.cosmographInstance) return;
		const instance = this.cosmographInstance as {
			selectPointsByIds?: (ids: string[]) => void;
			unselectAllPoints?: () => void;
		};
		if (nodeIds === null || nodeIds.length === 0) {
			instance.unselectAllPoints?.();
		} else {
			instance.selectPointsByIds?.(nodeIds);
		}
	}

	private renderFallback(): void {
		const msg = document.createElement("div");
		msg.style.cssText =
			"display:flex;align-items:center;justify-content:center;height:100%;color:#888;font-family:sans-serif;";
		msg.textContent = "Install @cosmograph/cosmograph to enable 2D graph visualization";
		this.container.appendChild(msg);
		this.addedElements.push(msg);
	}
}
