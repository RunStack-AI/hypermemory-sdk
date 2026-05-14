# HyperMemory SDK

Official TypeScript SDK for the [HyperMemory](https://hypermemory.io) agentic long-term memory platform. Store, recall, traverse, and visualize interconnected knowledge — from any JavaScript/TypeScript environment.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

## Packages

| Package | Description |
|---------|-------------|
| [`@runstack-ai/hypermemory-core`](./packages/core) | Client SDK — store, recall, update, traverse |
| [`@runstack-ai/hypermemory-visualizer-core`](./packages/visualizer-core) | Vanilla JS graph viewers (Cosmograph 2D + Three.js 3D) |
| [`@runstack-ai/hypermemory-svelte`](./packages/svelte) | Svelte 5 components + composable |
| [`@runstack-ai/hypermemory-react`](./packages/react) | React 18+ components + hook |

## Installation

Install only what you need:

```bash
# Core client only (Node.js, Deno, Bun, browsers)
pnpm add @runstack-ai/hypermemory-core

# Svelte app with visualization
pnpm add @runstack-ai/hypermemory-core @runstack-ai/hypermemory-svelte @runstack-ai/hypermemory-visualizer-core @cosmograph/cosmograph

# React app with visualization
pnpm add @runstack-ai/hypermemory-core @runstack-ai/hypermemory-react @runstack-ai/hypermemory-visualizer-core @cosmograph/cosmograph

# 3D visualization (additional)
pnpm add 3d-force-graph three
pnpm add -D @types/three  # Required for TypeScript projects
```

**Requirements:** Node.js >= 18.0.0 | Native `fetch` required | Tested on Node 18+, Chrome/Edge 90+, Firefox 88+, Safari 14+. `AbortSignal.any` is polyfilled for older runtimes.

## Concepts

A **node** is a unit of memory — a person, decision, project, fact, etc. Each node has a `key` (`{type}_{name}` like `person_jane` or `decision_jwt_auth`), a free-text `description`, and an optional `node_type` (the SDK provides 20 axiom types for color/categorization, but any string is valid).

A **relationship** is a directed edge between two nodes with a plain-language label describing how they connect. The label *is* the relationship — be specific ("leads engineering at"), not generic ("uses").

A **hyperedge** groups 3+ nodes under a single indivisible relationship — for things no chain of pairwise edges can express (a team where all members are jointly necessary, a decision context that requires every participant).

The graph is searched semantically by `recall()` (vector similarity over descriptions) or traversed structurally by `findRelated()` from a starting node.

## Quick Start

### Store and Recall Knowledge

```typescript
import { HyperMemoryClient } from "@runstack-ai/hypermemory-core";

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
import { HyperMemoryProvider, HyperMemoryGraph2D } from "@runstack-ai/hypermemory-react";

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
  import { HyperMemoryProvider, HyperMemoryGraph2D } from "@runstack-ai/hypermemory-svelte";
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

### Vanilla JS / TypeScript (No Framework)

```typescript
// Inline snippet — works in any bundler-based project (Vite, esbuild, Webpack)
import { HyperMemoryClient } from "@runstack-ai/hypermemory-core";
import { CosmographViewer } from "@runstack-ai/hypermemory-visualizer-core";

const client = new HyperMemoryClient({ apiKey: "hm_your_key" });
const viewer = new CosmographViewer(document.getElementById("graph")!, {
  showHyperedges: true,
  onNodeClick: (node) => console.log("Clicked:", node.node_key),
  onHullClick: (hull) => console.log("Hull:", hull.label),
});

const graph = await client.getPublicGraph("graph:your_id");
await viewer.setData(graph.nodes, graph.links);
```

### Server-Side Rendering (Next.js App Router, SvelteKit)

The framework bindings are **client-only**. All React components carry a `"use client";` directive; Svelte components mount via `onMount` and only render in the browser. Importing them from a server component in Next.js works (they'll be deferred), but they will not render any output on the server.

If you call `HyperMemoryClient` directly from a server route (e.g. Next.js Route Handler, SvelteKit `+page.server.ts`), use the `@runstack-ai/hypermemory-core` package — no DOM dependencies, native `fetch` only.

## Cancellation

Every client method accepts an optional `AbortSignal` for cancellation:

```typescript
const ac = new AbortController();

setTimeout(() => ac.abort(), 5000); // cancel after 5s

try {
  const results = await hm.recall({ query: "..." }, { signal: ac.signal });
} catch (err) {
  if (err instanceof NetworkError && err.message === "Request was cancelled") {
    // handle cancellation
  }
}
```

This is the recommended pattern for keystroke-driven search UIs and for cancelling in-flight requests on unmount in React/Svelte components.

## Observability

Pass an `onRequest` callback to the client (or to the React/Svelte `<HyperMemoryProvider>`) to observe every HTTP attempt:

```typescript
const hm = new HyperMemoryClient({
  apiKey: "hm_...",
  onRequest: (method, url, status, durationMs) => {
    console.log(`${method} ${url} → ${status} (${durationMs}ms)`);
  },
});
```

The callback fires exactly once per attempt, including retries. Status is `0` for network errors and timeouts.

Use `client.getRateLimit()` to read the most recent rate-limit headers:

```typescript
const rl = hm.getRateLimit();
if (rl) console.log(`${rl.remaining}/${rl.limit} requests remaining, resets at ${rl.resetAt}`);
```

## API Reference

### `@runstack-ai/hypermemory-core`

#### `HyperMemoryClient`

```typescript
const hm = new HyperMemoryClient({
  apiKey: string;       // Required: your hm_* API key
  baseUrl?: string;     // Default: "https://api.hypermemory.io"
  maxRetries?: number;  // Default: 3 (retries on 429; 5xx for GET/HEAD/DELETE only)
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
| `exportGraph(opts?)` | Export full graph as JSON |
| `getPublicGraph(graphId)` | Fetch a graph by ID (requires auth + api_access) |
| `getRateLimit()` | Get rate limit info from last request |

### `@runstack-ai/hypermemory-visualizer-core`

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

> **Note:** When `showHyperedges` is enabled, clicking a node that sits **inside** a hyperedge hull fires **both** `onNodeClick` and `onHullClick`. Branch on whichever you need, or set a stateful flag in your handler if you want exclusive handling.

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

### `@runstack-ai/hypermemory-svelte`

| Export | Description |
|--------|-------------|
| `HyperMemoryProvider` | Context provider (pass `apiKey`) |
| `HyperMemoryGraph2D` | 2D Cosmograph wrapper component |
| `HyperMemoryGraph3D` | 3D Force Graph wrapper component |
| `useHyperMemory()` | Composable returning the client instance |

### `@runstack-ai/hypermemory-react`

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
  AuthenticationError,  // 401 — invalid API key
  ForbiddenError,       // 403 — insufficient permissions
  BadRequestError,      // 400 — malformed request
  NotFoundError,        // 404 — resource doesn't exist
  RateLimitError,       // 429 — rate limited (check .retryAfter)
  ValidationError,      // 422 — invalid request body
  PlanLimitError,       // 403 — monthly plan cap reached
  ServerError,          // 500+ — server failure
  NetworkError,         // Request didn't reach server
  TimeoutError,         // Request timed out
} from "@runstack-ai/hypermemory-core";

try {
  await hm.store({ key: "test", description: "..." });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Retry after ${error.retryAfter} seconds`);
  }
}
```

**Automatic retries:** The SDK retries failed requests with exponential backoff:
- **429 (Rate Limited)** — retried on all methods (the server didn't process the request)
- **502/503/504 (Server Error)** — retried only on `GET`/`HEAD`/`DELETE` (non-idempotent writes like POST are not retried to prevent double-writes)

The `Retry-After` header is respected when present. If you need writes to survive transient 5xx, send your own `Idempotency-Key` header by wrapping the SDK call yourself (or wait — first-class idempotency support is planned for v0.2).

## Rate Limits

Per-minute sliding window by plan:

| Operation | Free | Basic | Pro | Business | Custom |
|-----------|------|-------|-----|----------|--------|
| Write (store/update/forget/addRelationships) | 10 | 20 | 60 | 120 | Custom |
| Ingest (ingest/upload) | 3 | 10 | 30 | 100 | Custom |
| Read (recall/overview/relationships/findRelated) | 30 | 60 | 120 | 240 | Custom |

| Tier | Description |
|------|-------------|
| **Write** | Per-tool limit on write operations (store/update/forget/addRelationships). Applies to both REST and MCP. |
| **Ingest** | Per-tool limit on bulk ingestion endpoints. |
| **Read** | Per-tool limit on retrieval (recall/overview/relationships/findRelated). |

> **Note:** Timeline operations are not currently rate-limited.

## Authentication

All API calls require a Bearer token with your `hm_*` API key:

- Keys are generated during account provisioning by your platform provider
- Keys are HMAC-SHA256 validated server-side
- Each request is independently authenticated (no sessions)

### Using the same key with MCP

The HyperMemory MCP server at `POST https://api.hypermemory.io/mcp` accepts the same `hm_*` Bearer token. This means a single key works for both the REST SDK (this package) and the MCP integration that powers AI agents. See the [HyperMemory docs](https://hypermemory.io/docs) for the MCP protocol details.

## Going to Production

- **Never put `hm_*` keys in browser-bundled code.** All Bearer-token calls should be made server-side or proxied. There are no unauthenticated SDK endpoints.
- **Memoize the `HyperMemoryClient` instance.** Each instance maintains its own retry/rate-limit state. The React/Svelte providers already do this — for vanilla use, hold a single module-level instance.
- **Handle `RateLimitError.retryAfter` and `PlanLimitError` separately.** The first is transient (retry later); the second requires user action (upgrade plan).
- **Tag requests via `onRequest`** for tracing — emit to your observability system of choice.
- **Writes are not idempotent across network blips.** If you absolutely need exactly-once writes during partial failures, deduplicate at your application layer (until v0.2 ships first-class idempotency).

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `AuthenticationError: Invalid API key` | Wrong key or expired | Verify your `hm_*` key in the dashboard |
| `ValidationError` on `store` | Missing `key` or `description`, or `key` doesn't match `{type}_{name}` format | Check the request shape |
| `RateLimitError` after a burst | Plan rate-limit hit | Slow down, or upgrade |
| `PlanLimitError` | Monthly quota exhausted | Wait for reset or upgrade |
| `NetworkError: Request was cancelled` | Your `AbortSignal` aborted | Expected, handle it |
| `TimeoutError` | Server slow or network bad | Increase `timeout` option, check connectivity |
| `useHyperMemory() must be used inside a <HyperMemoryProvider>` | Component rendered outside the provider tree | Wrap your tree |
| 2D viewer shows "Install @cosmograph/cosmograph..." | Optional peer dep missing | `pnpm add @cosmograph/cosmograph` |
| 3D viewer shows "Install 3d-force-graph and three..." | Optional peer deps missing | `pnpm add 3d-force-graph three @types/three` |

## AI Agent Skill File

For AI coding assistants (Cursor, Windsurf, Cline, etc.), point them to the canonical skill file:

```
https://raw.githubusercontent.com/RunStack-AI/hypermemory-sdk/main/skill/SKILL.md
```

This provides always-up-to-date instructions for using HyperMemory as persistent memory.

## Development

```bash
pnpm install
pnpm build          # Build all packages
pnpm test           # Run all tests
pnpm typecheck      # Verify types across all packages
pnpm lint           # Lint with biome
```

## License

MIT — see [LICENSE](./LICENSE) for details.
