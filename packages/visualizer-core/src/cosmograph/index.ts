/**
 * CosmographViewer — GPU-accelerated 2D graph visualization using Cosmograph.
 *
 * Mounts to any DOM element and renders an interactive hypergraph
 * with force-directed layout, node filtering, and hyperedge hull rendering.
 *
 * @example
 * ```typescript
 * import { CosmographViewer } from "@hypermemory/visualizer-core";
 *
 * const viewer = new CosmographViewer(document.getElementById("graph")!, {
 *   showHyperedges: true,
 *   onNodeClick: (node) => console.log("Clicked:", node.node_key),
 *   onHullClick: (hull) => console.log("Hull:", hull.label),
 * });
 *
 * viewer.setData(nodes, links, hyperedges);
 * ```
 */

import { getNodeColor } from "../shared/colors.js";
import type { GraphLink, GraphNode, HyperedgeHull } from "../shared/types.js";
import { type CosmographViewerOptions, DEFAULT_SIMULATION } from "./config.js";
import { convexHull } from "./hull.js";

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

const HULL_FILL = "rgba(80, 140, 255, 0.12)";
const HULL_HOVER_STROKE = "#FFD700";
const HULL_PADDING = 30;

export class CosmographViewer {
	private container: HTMLElement;
	private options: CosmographViewerOptions;
	private cosmographInstance: unknown = null;
	private nodes: GraphNode[] = [];
	private links: GraphLink[] = [];
	private hyperedges: HyperedgeHull[] = [];
	private currentInternalNodes: InternalNode[] = [];
	private showHyperedges: boolean;
	private showOrphans: boolean;
	private showDocs: boolean;
	private destroyed = false;
	private renderSeq = 0;
	private addedElements: Element[] = [];

	private hullCanvas: HTMLCanvasElement | null = null;
	private hullRafId: number | null = null;
	private hoveredHullIdx = -1;
	private mouseX = -1;
	private mouseY = -1;

	private boundMouseMove: ((e: MouseEvent) => void) | null = null;
	private boundMouseLeave: (() => void) | null = null;
	private boundClick: ((e: MouseEvent) => void) | null = null;

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
	async setData(
		nodes: GraphNode[],
		links: GraphLink[],
		hyperedges?: HyperedgeHull[],
	): Promise<void> {
		this.nodes = nodes;
		this.links = links;
		this.hyperedges = hyperedges ?? [];
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

	/** Toggle hyperedge hull rendering visibility. */
	toggleHyperedges(show: boolean): void {
		this.showHyperedges = show;
		if (this.hullCanvas) {
			this.hullCanvas.style.display = show ? "block" : "none";
		}
		if (show) {
			this.scheduleHullDraw();
		}
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
		if (this.hullRafId !== null) {
			cancelAnimationFrame(this.hullRafId);
			this.hullRafId = null;
		}
		this.removeHullCanvasListeners();
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
				onZoom: () => this.scheduleHullDraw(),
				onSimulationTick: () => this.scheduleHullDraw(),
			};

			this.cosmographInstance = new Cosmograph(this.container, config);
			this.setupHullCanvas();
			setTimeout(() => this.scheduleHullDraw(), 600);
		} catch {
			this.renderFallback();
		}
	}

	private setupHullCanvas(): void {
		if (this.hullCanvas) {
			this.hullCanvas.remove();
			this.removeHullCanvasListeners();
		}

		const canvas = document.createElement("canvas");
		canvas.style.cssText =
			"position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:auto;z-index:1;";
		canvas.style.display = this.showHyperedges ? "block" : "none";

		this.container.style.position = "relative";
		this.container.appendChild(canvas);
		this.addedElements.push(canvas);
		this.hullCanvas = canvas;

		this.boundMouseMove = (e: MouseEvent) => this.handleHullMouseMove(e);
		this.boundMouseLeave = () => this.handleHullMouseLeave();
		this.boundClick = (_e: MouseEvent) => this.handleHullClick();

		canvas.addEventListener("mousemove", this.boundMouseMove);
		canvas.addEventListener("mouseleave", this.boundMouseLeave);
		canvas.addEventListener("click", this.boundClick);
	}

	private removeHullCanvasListeners(): void {
		if (!this.hullCanvas) return;
		if (this.boundMouseMove) this.hullCanvas.removeEventListener("mousemove", this.boundMouseMove);
		if (this.boundMouseLeave)
			this.hullCanvas.removeEventListener("mouseleave", this.boundMouseLeave);
		if (this.boundClick) this.hullCanvas.removeEventListener("click", this.boundClick);
		this.boundMouseMove = null;
		this.boundMouseLeave = null;
		this.boundClick = null;
	}

	private scheduleHullDraw(): void {
		if (this.hullRafId !== null) cancelAnimationFrame(this.hullRafId);
		this.hullRafId = requestAnimationFrame(() => this.drawHulls());
	}

	private drawHulls(): void {
		this.hullRafId = null;
		if (!this.hullCanvas || !this.cosmographInstance || this.destroyed) return;

		const rect = this.container.getBoundingClientRect();
		this.syncCanvasSize(this.hullCanvas, rect.width, rect.height);

		const ctx = this.hullCanvas.getContext("2d");
		if (!ctx) return;

		ctx.clearRect(0, 0, rect.width, rect.height);

		if (!this.showHyperedges || this.hyperedges.length === 0) return;

		const hullShapes = this.computeHullShapes();
		if (!hullShapes) return;

		this.renderHullFills(ctx, hullShapes);
		this.detectHoveredHull(ctx, hullShapes);
		this.renderHoverHighlight(ctx, hullShapes);
	}

	private syncCanvasSize(canvas: HTMLCanvasElement, w: number, h: number): void {
		if (canvas.width !== w || canvas.height !== h) {
			canvas.width = w;
			canvas.height = h;
		}
	}

	private computeHullShapes(): { x: number; y: number }[][] | null {
		const cosmo = this.cosmographInstance as {
			getPointPositionByIndex?: (idx: number) => [number, number] | null;
			spaceToScreenPosition?: (pos: [number, number]) => [number, number] | null;
		};

		const getPos = cosmo.getPointPositionByIndex;
		const toScreen = cosmo.spaceToScreenPosition;
		if (!getPos || !toScreen) return null;

		const idToIndex = new Map<string, number>();
		for (let i = 0; i < this.currentInternalNodes.length; i++) {
			const node = this.currentInternalNodes[i];
			if (node) idToIndex.set(node.id, i);
		}

		return this.hyperedges.map((he) => {
			const screenPts: { x: number; y: number }[] = [];
			for (const memberId of he.members) {
				const idx = idToIndex.get(memberId);
				if (idx === undefined) continue;
				const spacePos = getPos(idx);
				if (!spacePos) continue;
				const screenPos = toScreen(spacePos);
				if (screenPos) screenPts.push({ x: screenPos[0], y: screenPos[1] });
			}
			if (screenPts.length < 2) return [];
			return screenPts.length < 3 ? screenPts : convexHull(screenPts);
		});
	}

	private renderHullFills(
		ctx: CanvasRenderingContext2D,
		hullShapes: { x: number; y: number }[][],
	): void {
		for (let i = 0; i < hullShapes.length; i++) {
			const shape = hullShapes[i];
			if (!shape || shape.length < 2) continue;
			ctx.beginPath();
			this.buildPaddedHullPath(ctx, shape, HULL_PADDING);
			ctx.fillStyle = this.hyperedges[i]?.color ?? HULL_FILL;
			ctx.fill();
		}
	}

	private detectHoveredHull(
		ctx: CanvasRenderingContext2D,
		hullShapes: { x: number; y: number }[][],
	): void {
		this.hoveredHullIdx = -1;
		if (this.mouseX < 0 || this.mouseY < 0) return;

		for (let i = hullShapes.length - 1; i >= 0; i--) {
			const shape = hullShapes[i];
			if (!shape || shape.length < 2) continue;
			ctx.beginPath();
			this.buildPaddedHullPath(ctx, shape, HULL_PADDING);
			if (ctx.isPointInPath(this.mouseX, this.mouseY)) {
				this.hoveredHullIdx = i;
				return;
			}
		}
	}

	private renderHoverHighlight(
		ctx: CanvasRenderingContext2D,
		hullShapes: { x: number; y: number }[][],
	): void {
		if (!this.hullCanvas) return;
		const shape = this.hoveredHullIdx >= 0 ? hullShapes[this.hoveredHullIdx] : undefined;
		if (shape && shape.length >= 2) {
			ctx.beginPath();
			this.buildPaddedHullPath(ctx, shape, HULL_PADDING);
			ctx.strokeStyle = HULL_HOVER_STROKE;
			ctx.lineWidth = 2;
			ctx.stroke();
			this.hullCanvas.style.cursor = "pointer";
		} else {
			this.hullCanvas.style.cursor = "default";
		}
	}

	private buildPaddedHullPath(
		ctx: CanvasRenderingContext2D,
		points: { x: number; y: number }[],
		padding: number,
	): void {
		if (points.length === 0) return;

		const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
		const cy = points.reduce((s, p) => s + p.y, 0) / points.length;

		const expanded = points.map((p) => {
			const dx = p.x - cx;
			const dy = p.y - cy;
			const len = Math.sqrt(dx * dx + dy * dy) || 1;
			return { x: p.x + (dx / len) * padding, y: p.y + (dy / len) * padding };
		});

		const first = expanded[0];
		if (!first) return;
		ctx.moveTo(first.x, first.y);
		for (let i = 1; i < expanded.length; i++) {
			const pt = expanded[i];
			if (pt) ctx.lineTo(pt.x, pt.y);
		}
		ctx.closePath();
	}

	private handleHullMouseMove(event: MouseEvent): void {
		const rect = this.container.getBoundingClientRect();
		this.mouseX = event.clientX - rect.left;
		this.mouseY = event.clientY - rect.top;
		this.scheduleHullDraw();
	}

	private handleHullMouseLeave(): void {
		this.mouseX = -1;
		this.mouseY = -1;
		this.hoveredHullIdx = -1;
		this.scheduleHullDraw();
	}

	private handleHullClick(): void {
		if (this.hoveredHullIdx >= 0 && this.options.onHullClick) {
			const hull = this.hyperedges[this.hoveredHullIdx];
			if (hull) this.options.onHullClick(hull);
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
