# Changelog

## 1.0.0 (2026-05-14)

### Stable Release

The HyperMemory SDK reaches 1.0 — a full-featured TypeScript SDK for the HyperMemory agentic long-term memory platform. This release includes a framework-agnostic core client, GPU-accelerated 2D and 3D graph visualization with hyperedge hull rendering, and first-class bindings for React 18+ and Svelte 5.

### Packages

| Package | Description |
|---------|-------------|
| `@hypermemory/core` | Framework-agnostic HTTP client — zero external dependencies |
| `@hypermemory/visualizer-core` | Vanilla JS viewers (Cosmograph 2D + Three.js 3D) |
| `@hypermemory/svelte` | Svelte 5 components + runes-based composable |
| `@hypermemory/react` | React 18+ components + hook (Next.js App Router compatible) |

---

### `@hypermemory/core`

**Client API** — Full REST API coverage for the HyperMemory platform:

- `store` / `update` / `forget` — create, modify, and delete nodes
- `recall` — semantic vector search with optional regex mode and session scoping
- `overview` — graph statistics (node/edge/hyperedge counts)
- `ingest` — parse unstructured text into structured graph nodes
- `getRelationships` / `addRelationships` — edge management
- `findRelated` — structural graph traversal from a starting node
- `timelineWrite` / `timelineRead` — event timeline diary
- `exportGraph` — full graph export as JSON/CSV
- `getPublicGraph` — fetch public graphs by ID (no auth required)
- `getRateLimit` — inspect rate limit headers from the most recent response

**Error handling** — Typed error hierarchy with 11 error classes:

- `HyperMemoryError` (base), `AuthenticationError` (401), `ForbiddenError` (403), `BadRequestError` (400), `NotFoundError` (404), `ValidationError` (422), `RateLimitError` (429), `PlanLimitError` (403 plan cap), `ServerError` (5xx), `NetworkError`, `TimeoutError`
- `RateLimitError` carries `retryAfter`, `limit`, and `windowSeconds`
- `PlanLimitError` carries the `plan` tier that was exceeded

**HTTP robustness:**

- Automatic retry with exponential backoff on 429 and 5xx
- `Retry-After` header honored (numeric seconds and HTTP-date formats)
- Idempotent-only retries on 5xx (GET/HEAD/DELETE); all methods retried on 429
- `AbortSignal` support on every client method via `MethodOptions`
- `AbortSignal.any` polyfill for runtimes without native support
- Configurable `timeout` and `maxRetries`
- `onRequest` observability callback (fires once per attempt with method, URL, status, duration)

**Zero dependencies** — uses native `fetch` only. Works in Node.js 18+, Deno, Bun, and modern browsers.

---

### `@hypermemory/visualizer-core`

**CosmographViewer** — GPU-accelerated 2D graph visualization:

- Powered by `@cosmograph/cosmograph` (optional peer dependency)
- Hyperedge hull rendering via frame-synced canvas overlay
- Convex hull computation with padded SVG-style paths
- Hull hover highlighting and click detection
- HiDPI/Retina canvas rendering at `devicePixelRatio`
- `ResizeObserver`-based layout sync (no per-frame `getBoundingClientRect`)
- Node search, selection, fit-to-view, pause/resume
- 20-color palette for axiom node types
- Configurable simulation parameters, background color, node colors

**ForceGraph3DViewer** — Three.js 3D graph visualization:

- Powered by `3d-force-graph` (optional peer dependency)
- Camera fly-to on node selection with configurable duration
- Neighbor highlighting on hover
- Configurable charge strength and link distance
- Node search, selection, fit-to-screen
- Proper cleanup on `destroy()`

**Framework-agnostic** — both viewers mount to any DOM element and work with any framework or vanilla JS.

---

### `@hypermemory/react`

- `HyperMemoryProvider` — React Context provider with `apiKey`, `baseUrl`, `maxRetries`, `timeout`, `onRequest` props
- `HyperMemoryGraph2D` — managed Cosmograph 2D wrapper with `graphId`, `nodes`/`links` props, `onNodeClick`/`onHullClick` callbacks
- `HyperMemoryGraph3D` — managed 3D Force Graph wrapper
- `useHyperMemory()` — typed hook returning the `HyperMemoryClient` from context
- All exports carry `"use client"` directives for Next.js App Router
- Stale-callback protection via `useRef` pattern
- AbortController cleanup on component unmount

---

### `@hypermemory/svelte`

- `HyperMemoryProvider` — Svelte 5 context provider with reactive getter pattern
- `HyperMemoryGraph2D` — reactive Cosmograph 2D wrapper with `$effect`-based data loading
- `HyperMemoryGraph3D` — reactive 3D Force Graph wrapper
- `useHyperMemory()` — runes-based composable (`$state`, `$derived`, `$effect`)
- `svelte-package` compatible (sources in `src/lib/`)
- AbortController cleanup on component destroy

---

### Documentation

- Comprehensive root README with Concepts, Quick Start (React, Svelte, vanilla), Cancellation, Observability, SSR, Error Handling, Rate Limits, Authentication, Going to Production, and Troubleshooting sections
- Per-package READMEs with install commands, minimum examples, and full export lists
- JSDoc on all public classes, methods, interfaces, and error types
- `CONTRIBUTING.md` with local setup, repository layout, and workflow
- `SECURITY.md` with vulnerability reporting policy
- `CHANGELOG.md` with full release history

### Skill File

- Canonical `skill/SKILL.md` for AI agent integration (Cursor, Windsurf, Cline, etc.)
- Human-readable header for developers + absolute directive language for LLMs
- SDK Integration section with TypeScript examples for all operations
- Hosted at `https://raw.githubusercontent.com/RunStack-AI/hypermemory-sdk/main/skill/SKILL.md`

---

### Pre-release History

#### 0.1.1 (2026-05-14)

Bug fixes across all packages — see below for details.

**`@hypermemory/visualizer-core`:**
- Hull rendering implemented with frame-synced canvas overlay
- Hull canvas uses `pointer-events: none` for click passthrough
- HiDPI canvas rendering at `devicePixelRatio`
- `ResizeObserver` layout sync replaces per-frame `getBoundingClientRect`
- Hover detection only on mousemove (was: every frame)
- Removed 600ms hull-draw delay
- Fixed Cosmograph `onClick` index mismatch
- Replaced `selectNodes` with Cosmograph v2 `selectPointsByIds`
- Fixed `setData` race condition via `renderSeq`
- Fixed `destroy()` cleanup scope
- Applied `chargeStrength`/`linkDistance` to 3D simulation
- Fixed `flyToNode` falsy-coord check

**`@hypermemory/core`:**
- Added `BadRequestError` (400) and `ForbiddenError` (403)
- `AuthenticationError` is 401-only
- `Retry-After` header honored
- Idempotent-only 5xx retries
- Fixed `onRequest` double-fire
- `onRequest` reports actual HTTP status
- `AbortSignal` support via `MethodOptions`
- Fixed `combineSignals` listener leak

**`@hypermemory/svelte`:**
- `src/lib/` layout for `svelte-package`
- Single `setContext` with reactive getter
- Fixed `mounted` flag, stale callbacks, AbortController cleanup
- Exposed `onRequest` prop

**`@hypermemory/react`:**
- `"use client"` directives on all exports
- `useRef` stale-callback fix, AbortController cleanup
- Exposed `onRequest` prop

#### 0.1.0 (2026-05-14)

Initial release — all packages.

---

## Known Limitations (planned for future releases)

- No first-class idempotency-key support for writes — POSTs that fail mid-transit can theoretically double-write on the server side (rare).
- No browser-side `happy-dom`/`jsdom` tests for the viewer classes (manual + production-monitored).
- `getRateLimit()` returns the most recent response's headers globally; concurrent requests race.
