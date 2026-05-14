# Changelog

## 0.1.0 (2026-05-14)

### Initial Release

#### `@hypermemory/core`
- `HyperMemoryClient` with full REST API coverage (store, recall, update, forget, overview, ingest, relationships, timeline, export)
- Typed error hierarchy with structured error codes
- Automatic retry with exponential backoff on 429/503
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
