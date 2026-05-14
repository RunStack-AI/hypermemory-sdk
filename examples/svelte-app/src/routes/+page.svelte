<!--
  Example: HyperMemory graph visualization in SvelteKit.

  Install:
    pnpm add @hypermemory/core @hypermemory/svelte @hypermemory/visualizer-core @cosmograph/cosmograph
-->
<script lang="ts">
  import { HyperMemoryProvider, HyperMemoryGraph2D } from "@hypermemory/svelte";
  import { useHyperMemory } from "@hypermemory/svelte";

  const API_KEY = "hm_your_api_key_here";
  const GRAPH_ID = "graph:your_graph_id";

  let showHyperedges = $state(false);
</script>

<HyperMemoryProvider apiKey={API_KEY}>
  <main>
    <h1>HyperMemory Knowledge Graph</h1>

    <div class="controls">
      <label>
        <input type="checkbox" bind:checked={showHyperedges} />
        Show Hyperedges
      </label>
    </div>

    <div class="graph-container">
      <HyperMemoryGraph2D
        graphId={GRAPH_ID}
        {showHyperedges}
        showOrphans={true}
        onNodeClick={(node) => console.log("Clicked:", node)}
        style="width:100%;height:600px;border-radius:8px;overflow:hidden;"
      />
    </div>
  </main>
</HyperMemoryProvider>

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: sans-serif;
  }

  .controls {
    margin: 1rem 0;
  }

  .graph-container {
    border: 1px solid #333;
    border-radius: 8px;
    background: #1a1a2e;
  }
</style>
