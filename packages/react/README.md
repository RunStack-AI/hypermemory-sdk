# @hypermemory/react

React 18+ components for HyperMemory graph visualization and client access.

## Installation

```bash
pnpm add @hypermemory/core @hypermemory/react @hypermemory/visualizer-core @cosmograph/cosmograph
```

## Usage

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

See the [root README](../../README.md) for full API reference.

## License

MIT
