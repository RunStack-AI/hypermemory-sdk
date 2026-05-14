# @hypermemory/svelte

Svelte 5 components for HyperMemory graph visualization and client access.

## Installation

```bash
pnpm add @hypermemory/core @hypermemory/svelte @hypermemory/visualizer-core @cosmograph/cosmograph
```

## Usage

```svelte
<script>
  import { HyperMemoryProvider, HyperMemoryGraph2D, useHyperMemory } from "@hypermemory/svelte";
</script>

<HyperMemoryProvider apiKey="hm_your_key">
  <HyperMemoryGraph2D
    graphId="graph:abc123"
    showHyperedges={false}
    onNodeClick={(node) => console.log(node)}
  />
</HyperMemoryProvider>
```

See the [root README](../../README.md) for full API reference.

## License

MIT
