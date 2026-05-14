# HyperMemory SDK

Official TypeScript SDK for the [HyperMemory](https://hypermemory.io) knowledge graph platform. Store, recall, traverse, and visualize interconnected knowledge — from any JavaScript/TypeScript environment.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

## Packages

| Package | Description |
|---------|-------------|
| [`@hypermemory/core`](./packages/core) | Client SDK — store, recall, update, traverse |
| [`@hypermemory/visualizer-core`](./packages/visualizer-core) | Vanilla JS graph viewers (Cosmograph 2D + Three.js 3D) |
| [`@hypermemory/svelte`](./packages/svelte) | Svelte 5 components + composable |
| [`@hypermemory/react`](./packages/react) | React 18+ components + hook |

## Installation

Install only what you need:

```bash
# Core client only (Node.js, Deno, Bun, browsers)
pnpm add @hypermemory/core

# Svelte app with visualization
pnpm add @hypermemory/core @hypermemory/svelte @hypermemory/visualizer-core @cosmograph/cosmograph

# React app with visualization
pnpm add @hypermemory/core @hypermemory/react @hypermemory/visualizer-core @cosmograph/cosmograph

# 3D visualization (additional)
pnpm add 3d-force-graph three
```

**Requirements:** Node.js >= 18.0.0

## Quick Start

### Store and Recall Knowledge

```typescript
import { HyperMemoryClient } from "@hypermemory/core";

const hm = new HyperMemoryClient({ apiKey: "hm_your_api_key" });

// Store a node
await hm.store({
  key: "person_jane",
  description: "Jane Doe — CTO at Acme Corp, expert in distributed systems",
  node_type: "person",
  relationships: [
    { to_key: "org_acme", relationship: "leads engineering at" },
    { to_key: "tech_rust", relationship: "advocates for" },
  ],
});

// Recall by semantic search
const results = await hm.recall({ query: "distributed systems experts" });
for (const r of results.results) {
  console.log(`${r.key}: ${r.description} (score: ${r.score})`);
}

// Get graph overview
const overview = await hm.overview();
console.log(`${overview.nodes} nodes, ${overview.edges} edges, ${overview.hyperedges} hyperedges`);
```

### Visualize a Graph (React)

```tsx
import { HyperMemoryProvider, HyperMemoryGraph2D } from "@hypermemory/react";

function App() {
  return (
    <HyperMemoryProvider apiKey="hm_your_api_key">
      <HyperMemoryGraph2D
        graphId="graph:your_graph_id"
        showHyperedges={false}
        onNodeClick={(node) => console.log(node)}
        style={{ width: "100%", height: "600px" }}
      />
    </HyperMemoryProvider>
  );
}
```

### Visualize a Graph (Svelte)

```svelte
<script>
  import { HyperMemoryProvider, HyperMemoryGraph2D } from "@hypermemory/svelte";
</script>

<HyperMemoryProvider apiKey="hm_your_api_key">
  <HyperMemoryGraph2D
    graphId="graph:your_graph_id"
    showHyperedges={false}
    onNodeClick={(node) => console.log(node)}
    style="width:100%;height:600px;"
  />
</HyperMemoryProvider>
```

### Vanilla JS (No Framework)

```typescript
import { HyperMemoryClient } from "@hypermemory/core";
import { CosmographViewer } from "@hypermemory/visualizer-core";

const client = new HyperMemoryClient({ apiKey: "hm_your_key" });
const viewer = new CosmographViewer(document.getElementById("graph")!);

const graph = await client.getPublicGraph("graph:your_id");
await viewer.setData(graph.nodes, graph.links);
```

## API Reference

### `@hypermemory/core`

#### `HyperMemoryClient`

```typescript
const hm = new HyperMemoryClient({
  apiKey: string;       // Required: your hm_* API key
  baseUrl?: string;     // Default: "https://api.hypermemory.io"
  maxRetries?: number;  // Default: 3 (retries on 429/503)
  timeout?: number;     // Default: 30000ms
  onRequest?: (method, url, status, durationMs) => void;
});
```

| Method | Description |
|--------|-------------|
| `store(req)` | Store a new node with optional relationships |
| `recall(req)` | Semantic search across the graph |
| `update(req)` | Update an existing node |
| `forget(key, cascade?)` | Delete a node |
| `overview()` | Get graph statistics |
| `ingest(req)` | Parse unstructured text into graph nodes |
| `getRelationships(key, pattern?)` | Get edges for a node |
| `addRelationships(req)` | Create new edges |
| `findRelated(req)` | Graph traversal from a starting node |
| `timelineWrite(req)` | Write a timeline event |
| `timelineRead(req?)` | Read timeline events |
| `exportGraph(opts?)` | Export full graph as JSON/CSV |
| `getPublicGraph(graphId)` | Fetch a public graph by ID |
| `getRateLimit()` | Get rate limit info from last request |

### `@hypermemory/visualizer-core`

#### `CosmographViewer` (2D, GPU-accelerated)

```typescript
const viewer = new CosmographViewer(container, {
  showHyperedges?: boolean;   // Default: false
  showOrphans?: boolean;      // Default: true
  showDocs?: boolean;         // Default: true
  backgroundColor?: string;   // Default: "#1a1a2e"
  nodeColors?: Record<string, string>;
  simulation?: Partial<CosmographSimulationConfig>;
  onNodeClick?: (node) => void;
  onHullClick?: (hull) => void;
});

await viewer.setData(nodes, links, hyperedges?);
viewer.search("query");
viewer.selectNode("node_key");
viewer.clearSelection();
viewer.toggleHyperedges(true);
viewer.fitView();
viewer.pause();
viewer.resume();
viewer.destroy();
```

#### `ForceGraph3DViewer` (3D, Three.js)

```typescript
const viewer = new ForceGraph3DViewer(container, {
  showOrphans?: boolean;      // Default: true
  showDocs?: boolean;         // Default: true
  backgroundColor?: string;   // Default: "#1a2332"
  nodeColors?: Record<string, string>;
  chargeStrength?: number;    // Default: -30
  linkDistance?: number;      // Default: 25
  onNodeClick?: (node) => void;
  flyToDuration?: number;     // Default: 1000ms
});

await viewer.setData(nodes, links);
viewer.search("query");
viewer.selectNode("node_key");
viewer.clearSelection();
viewer.fitToScreen();
viewer.destroy();
```

### `@hypermemory/svelte`

| Export | Description |
|--------|-------------|
| `HyperMemoryProvider` | Context provider (pass `apiKey`) |
| `HyperMemoryGraph2D` | 2D Cosmograph wrapper component |
| `HyperMemoryGraph3D` | 3D Force Graph wrapper component |
| `useHyperMemory()` | Composable returning the client instance |

### `@hypermemory/react`

| Export | Description |
|--------|-------------|
| `HyperMemoryProvider` | Context provider (pass `apiKey`) |
| `HyperMemoryGraph2D` | 2D Cosmograph wrapper component |
| `HyperMemoryGraph3D` | 3D Force Graph wrapper component |
| `useHyperMemory()` | Hook returning the client instance |

## Error Handling

All errors extend `HyperMemoryError`:

```typescript
import {
  AuthenticationError,  // 401/403 — invalid API key
  NotFoundError,        // 404 — resource doesn't exist
  RateLimitError,       // 429 — rate limited (check .retryAfter)
  ValidationError,      // 422 — invalid request body
  PlanLimitError,       // 403 — monthly plan cap reached
  ServerError,          // 500+ — server failure
  NetworkError,         // Request didn't reach server
  TimeoutError,         // Request timed out
} from "@hypermemory/core";

try {
  await hm.store({ key: "test", description: "..." });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Retry after ${error.retryAfter} seconds`);
  }
}
```

The SDK automatically retries on 429/503 with exponential backoff (respecting `Retry-After`).

## Rate Limits

Per-minute sliding window by plan:

| Operation | Free | Basic | Pro | Business | Enterprise |
|-----------|------|-------|-----|----------|-----------|
| Write (store/update/forget) | 10 | 20 | 60 | 120 | Custom |
| Ingest (ingest/upload) | 3 | 10 | 30 | 100 | Custom |
| Read (recall/overview/etc) | 30 | 60 | 120 | 240 | Custom |
| HTTP mutations | 60/min | 120 | 300 | 600 | Custom |

## AI Agent Skill File

For AI coding assistants (Cursor, Windsurf, Cline, etc.), point them to the canonical skill file:

```
https://raw.githubusercontent.com/RunStack-AI/hypermemory-sdk/main/skill/SKILL.md
```

This provides always-up-to-date instructions for using HyperMemory as persistent memory.

## Authentication

All API calls require a Bearer token with your `hm_*` API key:

- Keys are generated during account provisioning or from the HyperMemory dashboard
- Keys are HMAC-SHA256 validated server-side
- Each request is independently authenticated (no sessions)
- The MCP endpoint (`POST /mcp`) also accepts the same `hm_*` key

## Development

```bash
pnpm install
pnpm build          # Build all packages
pnpm test           # Run all tests
pnpm typecheck      # Verify types across all packages
pnpm lint           # Lint with biome
```

## Examples

- [`examples/vanilla/`](./examples/vanilla) — Plain HTML + TypeScript
- [`examples/svelte-app/`](./examples/svelte-app) — SvelteKit integration
- [`examples/react-app/`](./examples/react-app) — React + Vite integration

## License

MIT — see [LICENSE](./LICENSE) for details.
