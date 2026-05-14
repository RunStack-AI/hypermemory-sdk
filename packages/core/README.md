# @runstack-ai/hypermemory-core

Framework-agnostic TypeScript client for the HyperMemory hypergraph API. Zero external dependencies — uses native `fetch`.

## Install

```bash
pnpm add @runstack-ai/hypermemory-core
# or
npm install @runstack-ai/hypermemory-core
```

## Minimum Example

```typescript
import { HyperMemoryClient } from "@runstack-ai/hypermemory-core";

const hm = new HyperMemoryClient({ apiKey: "hm_your_api_key" });

await hm.store({
  key: "tech_react",
  description: "React — UI library by Meta",
  node_type: "technology",
});

const results = await hm.recall({ query: "frontend frameworks" });
```

## Exports

- `HyperMemoryClient` — the main client class
- `HttpClient` — low-level HTTP transport (advanced)
- `MethodOptions`, `ClientOptions`, request/response types
- 11 error classes: `HyperMemoryError`, `AuthenticationError`, `ForbiddenError`, `BadRequestError`, `NotFoundError`, `ValidationError`, `RateLimitError`, `PlanLimitError`, `ServerError`, `NetworkError`, `TimeoutError`

## Full Docs

See the [monorepo README](https://github.com/RunStack-AI/hypermemory-sdk#readme).

## License

MIT
