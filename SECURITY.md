# Security Policy

## Reporting a vulnerability

Email security@hypermemory.io with details. Do **not** open a public issue.

We aim to acknowledge within 48 hours and patch within 7 days for critical issues.

## Scope

- `@runstack-ai/hypermemory-core`, `@runstack-ai/hypermemory-visualizer-core`, `@runstack-ai/hypermemory-react`, `@runstack-ai/hypermemory-svelte` packages.
- The `skill/SKILL.md` agent integration file.

## Out of scope

- The HyperMemory API itself — report API vulnerabilities directly to security@hypermemory.io.
- Third-party peer dependencies (`@cosmograph/cosmograph`, `3d-force-graph`, `three`, `react`, `svelte`).

## Best practices for consumers

- Never expose `hm_*` API keys in browser-shipped code. All authenticated calls should originate from server-side code.
- Treat `error.body` on thrown errors as opaque — log it, but don't render it to end users (server-side error messages may echo user input).
- Validate `to_key`/`from_key` values you accept from untrusted sources before passing to `store`/`addRelationships`.
