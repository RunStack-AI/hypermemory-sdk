# Changelog

## 0.1.1 (2026-05-14)

### Bug Fixes

#### `@hypermemory/visualizer-core`
- **Hull rendering now works** — frame-synced canvas overlay using `getPointPositionByIndex` + `spaceToScreenPosition` (modeled on production viewer)
- Fix Cosmograph `onClick` index mismatch when nodes are filtered
- Replace `selectNodes` with Cosmograph v2 `selectPointsByIds` API
- Fix `setData` race condition via `renderSeq` counter
- Fix `destroy()` — only removes elements the viewer created, not the whole container
- Apply `chargeStrength` and `linkDistance` to 3D force simulation
- Fix `flyToNode` falsy-coord check (`== null` instead of `!`)

#### `@hypermemory/core`
- Add `BadRequestError` (400) and `ForbiddenError` (403) to error hierarchy
- `AuthenticationError` is now 401-only by default
- Honor HTTP `Retry-After` header (numeric seconds and HTTP-date) before body fallback
- Only retry POST/PUT/PATCH on 429 (not on 502/503/504 to prevent double-writes)
- Fix `onRequest` double-fire on non-retryable errors
- Add `AbortSignal` support to all client methods via `MethodOptions`
- Fix `combineSignals` polyfill listener leak
- Refactor `request()` into `attemptOnce()` to reduce cognitive complexity

#### `@hypermemory/svelte`
- Move sources to `src/lib/` for `svelte-package` compatibility
- Fix `HyperMemoryProvider` — single `setContext` with reactive getter
- Fix `mounted` flag reactivity with `$state(false)`
- Fix stale `onNodeClick`/`onHullClick` callbacks via `$effect` re-wiring
- Cancel in-flight fetch on unmount via AbortController
- Expose `onRequest` prop in Provider

#### `@hypermemory/react`
- Add `"use client"` directives to all exports
- Fix stale-callback via `useRef` pattern
- Cancel in-flight fetch on unmount via AbortController
- Expose `onRequest` prop in Provider

### Removed
- Non-runnable skeleton examples (`examples/` directory)

---

## 0.1.0 (2026-05-14)

### Initial Release

#### `@hypermemory/core`
- `HyperMemoryClient` with full REST API coverage (store, recall, update, forget, overview, ingest, relationships, timeline, export)
- Typed error hierarchy with structured error codes
- Automatic retry with exponential backoff on 429/5xx
- Rate limit header parsing
- Configurable timeout via AbortController
- Zero external dependencies (native fetch)

#### `@hypermemory/visualizer-core`
- `CosmographViewer` — GPU-accelerated 2D graph with hyperedge hull rendering
- `ForceGraph3DViewer` — Three.js 3D graph with camera fly-to and neighbor highlighting
- Convex hull algorithm for hyperedge rendering
- 20-color palette for axiom node types
- Framework-agnostic (mounts to any DOM element)

#### `@hypermemory/svelte`
- `HyperMemoryProvider` — Svelte 5 context provider
- `HyperMemoryGraph2D` / `HyperMemoryGraph3D` — reactive graph components
- `useHyperMemory()` — runes-based composable

#### `@hypermemory/react`
- `HyperMemoryProvider` — React Context provider
- `HyperMemoryGraph2D` / `HyperMemoryGraph3D` — managed components
- `useHyperMemory()` — typed React hook

#### Skill File
- Canonical `skill/SKILL.md` for AI agent integration
- Hosted at `https://raw.githubusercontent.com/RunStack-AI/hypermemory-sdk/main/skill/SKILL.md`
