# Contributing to HyperMemory SDK

## Local setup

```bash
pnpm install
pnpm build      # required before typecheck (cross-package dependencies)
pnpm typecheck
pnpm test
pnpm lint
```

## Repository layout

- `packages/core` — framework-agnostic HTTP client (zero deps)
- `packages/visualizer-core` — vanilla JS viewers (Cosmograph 2D + 3D)
- `packages/react`, `packages/svelte` — framework bindings (peer-deps only)
- `tests/` — vitest suites (use `node` environment)
- `skill/SKILL.md` — canonical AI-agent integration file

## Workflow

1. Open an issue describing the change before sending a PR (especially for new public API).
2. All four commands above must pass.
3. Use Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).
4. Update `CHANGELOG.md` under the unreleased section.
5. Add tests for new behavior. Pure-function tests live in `tests/visualizer.test.ts`; HTTP behavior tests live in `tests/http.test.ts` and use `vi.stubGlobal("fetch", ...)`.

## Releasing

Maintainers only. Update `version` across all `packages/*/package.json` to match, tag `vX.Y.Z`, push tag.
