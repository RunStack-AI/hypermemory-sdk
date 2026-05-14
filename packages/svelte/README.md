# @hypermemory/svelte

Svelte 5 components and composable for HyperMemory graph visualization and client access. Uses runes (`$state`, `$derived`, `$effect`) throughout.

## Install

```bash
pnpm add @hypermemory/core @hypermemory/svelte

# For 2D visualization (optional)
pnpm add @hypermemory/visualizer-core @cosmograph/cosmograph

# For 3D visualization (optional)
pnpm add @hypermemory/visualizer-core 3d-force-graph three
pnpm add -D @types/three
```

## Minimum Example

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

## Exports

- `HyperMemoryProvider` — Svelte 5 context provider (accepts `apiKey`, `baseUrl`, `maxRetries`, `timeout`, `onRequest`)
- `HyperMemoryGraph2D` — 2D Cosmograph wrapper component
- `HyperMemoryGraph3D` — 3D Force Graph wrapper component
- `useHyperMemory()` — Runes-based composable returning the `HyperMemoryClient` from context
- Types: re-exports from `@hypermemory/core` and `@hypermemory/visualizer-core`

## Full Docs

See the [monorepo README](https://github.com/RunStack-AI/hypermemory-sdk#readme).

## License

MIT
