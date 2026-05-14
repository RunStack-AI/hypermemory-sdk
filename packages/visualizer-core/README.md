# @hypermemory/visualizer-core

Framework-agnostic graph visualization for HyperMemory hypergraphs. Provides two viewer classes:

- **CosmographViewer** — GPU-accelerated 2D with hyperedge hull rendering
- **ForceGraph3DViewer** — Three.js 3D with camera fly-to

## Install

```bash
# For 2D visualization
pnpm add @hypermemory/visualizer-core @cosmograph/cosmograph

# For 3D visualization
pnpm add @hypermemory/visualizer-core 3d-force-graph three
pnpm add -D @types/three  # Required for TypeScript users
```

## Minimum Example

```typescript
import { CosmographViewer } from "@hypermemory/visualizer-core";

const viewer = new CosmographViewer(document.getElementById("graph")!, {
  onNodeClick: (node) => console.log(node),
});

await viewer.setData(nodes, links, hyperedges);
```

## Exports

- `CosmographViewer` — 2D GPU-accelerated viewer with hyperedge hull rendering
- `ForceGraph3DViewer` — 3D Three.js viewer with camera fly-to
- `convexHull`, `paddedHullPath` — geometry utilities for hull computation
- `getNodeColor`, `NODE_COLORS` — 20-color palette for node types
- `DEFAULT_SIMULATION`, `DEFAULT_3D_CONFIG` — default simulation parameters
- Types: `CosmographViewerOptions`, `CosmographSimulationConfig`, `ForceGraph3DOptions`, `GraphNode`, `GraphLink`, `HyperedgeHull`, `BaseViewerOptions`

## Full Docs

See the [monorepo README](https://github.com/RunStack-AI/hypermemory-sdk#readme).

## License

MIT
