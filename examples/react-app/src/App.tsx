/**
 * Example: HyperMemory graph visualization in React.
 *
 * Install:
 *   pnpm add @hypermemory/core @hypermemory/react @hypermemory/visualizer-core @cosmograph/cosmograph
 */

import { useState } from "react";
import { HyperMemoryProvider, HyperMemoryGraph2D, useHyperMemory } from "@hypermemory/react";

const API_KEY = "hm_your_api_key_here";
const GRAPH_ID = "graph:your_graph_id";

function GraphPage() {
	const hm = useHyperMemory();
	const [showHyperedges, setShowHyperedges] = useState(false);

	const handleSearch = async () => {
		const results = await hm.recall({ query: "technology", max_results: 5 });
		console.log("Search results:", results);
	};

	return (
		<div>
			<div style={{ padding: "1rem", display: "flex", gap: "1rem", alignItems: "center" }}>
				<label>
					<input
						type="checkbox"
						checked={showHyperedges}
						onChange={(e) => setShowHyperedges(e.target.checked)}
					/>
					{" "}Show Hyperedges
				</label>
				<button onClick={handleSearch}>Search "technology"</button>
			</div>

			<HyperMemoryGraph2D
				graphId={GRAPH_ID}
				showHyperedges={showHyperedges}
				showOrphans={true}
				onNodeClick={(node) => console.log("Clicked:", node)}
				style={{ width: "100%", height: "600px", borderRadius: "8px" }}
			/>
		</div>
	);
}

export default function App() {
	return (
		<HyperMemoryProvider apiKey={API_KEY}>
			<main style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
				<h1>HyperMemory Hypergraph</h1>
				<GraphPage />
			</main>
		</HyperMemoryProvider>
	);
}
