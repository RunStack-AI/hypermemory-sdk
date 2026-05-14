<script lang="ts">
import { type ForceGraph3DOptions, ForceGraph3DViewer } from "@runstack-ai/hypermemory-visualizer-core";
import type { GraphLink, GraphNode } from "@runstack-ai/hypermemory-visualizer-core";
import { onDestroy, onMount } from "svelte";
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
let mounted = $state(false);
let abortController: AbortController | null = null;

const client = useHyperMemory();

onMount(() => {
	const options: ForceGraph3DOptions = {
		showOrphans,
		showDocs,
		nodeColors,
		backgroundColor,
		onNodeClick,
	};

	viewer = new ForceGraph3DViewer(containerEl, options);
	mounted = true;
});

$effect(() => {
	if (!viewer || !mounted) return;
	if (propNodes && propLinks) {
		viewer.setData(propNodes, propLinks);
	} else if (graphId) {
		abortController?.abort();
		const ac = new AbortController();
		abortController = ac;
		client.getPublicGraph(graphId, { signal: ac.signal }).then(
			(graph) => {
				if (!ac.signal.aborted) viewer?.setData(graph.nodes, graph.links);
			},
			(err) => {
				if (!ac.signal.aborted) console.error("[HyperMemoryGraph3D] Failed to fetch graph:", err);
			},
		);
	}
});

$effect(() => {
	if (viewer && onNodeClick) {
		viewer.onNodeClick(onNodeClick);
	}
});

onDestroy(() => {
	abortController?.abort();
	viewer?.destroy();
	viewer = null;
});
</script>

<div bind:this={containerEl} class={className} {style}></div>
