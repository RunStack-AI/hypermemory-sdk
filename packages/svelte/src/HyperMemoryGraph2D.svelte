<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { CosmographViewer, type CosmographViewerOptions } from "@hypermemory/visualizer-core";
	import type { GraphNode, GraphLink, HyperedgeHull } from "@hypermemory/visualizer-core";
	import { useHyperMemory } from "./useHyperMemory.svelte.js";

	interface Props {
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
		/** Node click handler */
		onNodeClick?: (node: GraphNode) => void;
		/** Hull click handler */
		onHullClick?: (hull: HyperedgeHull) => void;
		/** CSS class for the container */
		class?: string;
		/** Inline styles for the container */
		style?: string;
	}

	const {
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
		class: className = "",
		style = "width:100%;height:100%;position:relative;",
	}: Props = $props();

	let containerEl: HTMLElement;
	let viewer: CosmographViewer | null = null;

	const client = useHyperMemory();

	onMount(async () => {
		const options: CosmographViewerOptions = {
			showHyperedges,
			showOrphans,
			showDocs,
			nodeColors,
			backgroundColor,
			onNodeClick,
			onHullClick,
		};

		viewer = new CosmographViewer(containerEl, options);

		if (propNodes && propLinks) {
			await viewer.setData(propNodes, propLinks, propHyperedges ?? []);
		} else if (graphId) {
			try {
				const graph = await client.getPublicGraph(graphId);
				await viewer.setData(graph.nodes, graph.links);
			} catch (err) {
				console.error("[HyperMemoryGraph2D] Failed to fetch graph:", err);
			}
		}
	});

	$effect(() => {
		if (viewer) {
			viewer.toggleHyperedges(showHyperedges);
		}
	});

	$effect(() => {
		if (viewer) {
			viewer.toggleOrphans(showOrphans);
		}
	});

	$effect(() => {
		if (viewer) {
			viewer.toggleDocs(showDocs);
		}
	});

	$effect(() => {
		if (viewer && propNodes && propLinks) {
			viewer.setData(propNodes, propLinks, propHyperedges ?? []);
		}
	});

	onDestroy(() => {
		viewer?.destroy();
		viewer = null;
	});
</script>

<div bind:this={containerEl} class={className} {style}></div>
