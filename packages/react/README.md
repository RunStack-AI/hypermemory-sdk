# @hypermemory/react

React 18+ components and hook for HyperMemory graph visualization and client access. All exports carry `"use client"` directives for Next.js App Router compatibility.

## Install

```bash
pnpm add @hypermemory/core @hypermemory/react

# For 2D visualization (optional)
pnpm add @hypermemory/visualizer-core @cosmograph/cosmograph

# For 3D visualization (optional)
pnpm add @hypermemory/visualizer-core 3d-force-graph three
pnpm add -D @types/three
```

## Minimum Example

```tsx
import { HyperMemoryProvider, HyperMemoryGraph2D, useHyperMemory } from "@hypermemory/react";

function App() {
  return (
    <HyperMemoryProvider apiKey="hm_your_key">
      <HyperMemoryGraph2D
        graphId="graph:abc123"
        showHyperedges={false}
        onNodeClick={(node) => console.log(node)}
        style={{ width: "100%", height: "600px" }}
      />
    </HyperMemoryProvider>
  );
}
```

## Exports

- `HyperMemoryProvider` — React Context provider (accepts `apiKey`, `baseUrl`, `maxRetries`, `timeout`, `onRequest`)
- `HyperMemoryGraph2D` — 2D Cosmograph wrapper component
- `HyperMemoryGraph3D` — 3D Force Graph wrapper component
- `useHyperMemory()` — Hook returning the `HyperMemoryClient` instance from context
- Types: `HyperMemoryProviderProps`, `HyperMemoryGraph2DProps`, `HyperMemoryGraph3DProps`

## Full Docs

See the [monorepo README](https://github.com/RunStack-AI/hypermemory-sdk#readme).

## License

MIT
