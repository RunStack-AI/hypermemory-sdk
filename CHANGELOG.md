# Changelog

## 0.1.1 (2026-05-14)

### Bug Fixes

#### `@hypermemory/visualizer-core`
- **Hull rendering now works** — frame-synced canvas overlay using `getPointPositionByIndex` + `spaceToScreenPosition` (modeled on production viewer)
- Hull canvas now uses `pointer-events: none`; click/mouse handlers moved to container so non-hull clicks still reach Cosmograph
- Hull canvas renders at `devicePixelRatio` for crisp retina output
- Hull layout sync uses `ResizeObserver` instead of per-frame `getBoundingClientRect`
- Hover detection only re-runs on mousemove (was: every animation frame)
- Removed magic 600ms hull-draw delay — `onSimulationTick` handles initial layout
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
- `onRequest` now reports the actual HTTP status (was hardcoded `200` for any 2xx success)
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
- Documented `useHyperMemory` caching behavior when `apiKey` changes at runtime

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

---

## Known Limitations (planned for 0.2.0)

- No first-class idempotency-key support for writes — POSTs that fail mid-transit can theoretically double-write on the server side (rare).
- No browser-side `happy-dom`/`jsdom` tests for the viewer classes (manual + production-monitored).
- No GitHub Actions CI — `pnpm lint`/`typecheck`/`test`/`build` rely on developer discipline.
- `getRateLimit()` returns the most recent response's headers globally; concurrent requests race.
