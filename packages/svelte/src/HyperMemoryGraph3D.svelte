<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { ForceGraph3DViewer, type ForceGraph3DOptions } from "@hypermemory/visualizer-core";
	import type { GraphNode, GraphLink } from "@hypermemory/visualizer-core";
	import { useHyperMemory } from "./useHyperMemory.svelte.js";

	interface Props {
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
		/** Node click handler */
		onNodeClick?: (node: GraphNode) => void;
		/** CSS class for the container */
		class?: string;
		/** Inline styles for the container */
		style?: string;
	}

	const {
		graphId,
		nodes: propNodes,
		links: propLinks,
		showOrphans = true,
		showDocs = true,
		nodeColors,
		backgroundColor,
		onNodeClick,
		class: className = "",
		style = "width:100%;height:100%;position:relative;",
	}: Props = $props();

	let containerEl: HTMLElement;
	let viewer: ForceGraph3DViewer | null = null;

	const client = useHyperMemory();

	onMount(async () => {
		const options: ForceGraph3DOptions = {
			showOrphans,
			showDocs,
			nodeColors,
			backgroundColor,
			onNodeClick,
		};

		viewer = new ForceGraph3DViewer(containerEl, options);

		if (propNodes && propLinks) {
			await viewer.setData(propNodes, propLinks);
		} else if (graphId) {
			try {
				const graph = await client.getPublicGraph(graphId);
				await viewer.setData(graph.nodes, graph.links);
			} catch (err) {
				console.error("[HyperMemoryGraph3D] Failed to fetch graph:", err);
			}
		}
	});

	$effect(() => {
		if (viewer && propNodes && propLinks) {
			viewer.setData(propNodes, propLinks);
		}
	});

	onDestroy(() => {
		viewer?.destroy();
		viewer = null;
	});
</script>

<div bind:this={containerEl} class={className} {style}></div>
