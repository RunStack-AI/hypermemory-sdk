# @hypermemory/core

Framework-agnostic TypeScript client for the HyperMemory knowledge graph API.

## Installation

```bash
pnpm add @hypermemory/core
```

## Usage

```typescript
import { HyperMemoryClient } from "@hypermemory/core";

const hm = new HyperMemoryClient({ apiKey: "hm_your_api_key" });

await hm.store({
  key: "tech_react",
  description: "React — UI library by Meta",
  node_type: "technology",
});

const results = await hm.recall({ query: "frontend frameworks" });
```

See the [root README](../../README.md) for full API reference.

## License

MIT
