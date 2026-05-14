/**
 * Vanilla JS example — HyperMemory 3D graph visualization with Three.js Force Graph.
 *
 * Prerequisites:
 *   pnpm add @hypermemory/core @hypermemory/visualizer-core 3d-force-graph three
 */

import { HyperMemoryClient } from "@hypermemory/core";
import { ForceGraph3DViewer } from "@hypermemory/visualizer-core";

const API_KEY = "hm_your_api_key_here";
const GRAPH_ID = "graph:your_graph_id";

const client = new HyperMemoryClient({ apiKey: API_KEY });
const container = document.getElementById("graph")!;

const viewer = new ForceGraph3DViewer(container, {
	backgroundColor: "#1a2332",
	showOrphans: true,
	onNodeClick: (node) => {
		console.log("Node clicked:", node.node_key, node.description);
		viewer.selectNode(node.node_key);
	},
});

async function loadGraph() {
	const graph = await client.getPublicGraph(GRAPH_ID);
	await viewer.setData(graph.nodes, graph.links);
	console.log(`Loaded ${graph.nodes.length} nodes, ${graph.links.length} links`);
}

document.getElementById("btn-fit")?.addEventListener("click", () => {
	viewer.fitToScreen();
});

loadGraph().catch(console.error);
