# @hypermemory/visualizer-core

Framework-agnostic graph visualization for HyperMemory hypergraphs. Provides two viewer classes:

- **CosmographViewer** — GPU-accelerated 2D with hyperedge hull rendering
- **ForceGraph3DViewer** — Three.js 3D with camera fly-to

## Installation

```bash
# For 2D visualization
pnpm add @hypermemory/visualizer-core @cosmograph/cosmograph

# For 3D visualization
pnpm add @hypermemory/visualizer-core 3d-force-graph three
pnpm add -D @types/three  # Required for TypeScript users
```

## Usage

```typescript
import { CosmographViewer } from "@hypermemory/visualizer-core";

const viewer = new CosmographViewer(document.getElementById("graph")!, {
  onNodeClick: (node) => console.log(node),
});

await viewer.setData(nodes, links);
```

See the [root README](../../README.md) for full API reference.

## License

MIT
