/**
 * Svelte 5 runes-based composable for accessing the HyperMemory client.
 *
 * Must be called inside a component tree wrapped by `<HyperMemoryProvider>`.
 *
 * Note: If `apiKey` changes at runtime, the provider creates a new client automatically.
 * Components that cache the return value in a plain `let` should re-call this inside a
 * reactive context (`$derived` or `$effect`) to pick up the new client.
 *
 * @example
 * ```svelte
 * <script>
 *   import { useHyperMemory } from "@hypermemory/svelte";
 *   const hm = useHyperMemory();
 *
 *   async function search() {
 *     const results = await hm.recall({ query: "react" });
 *   }
 * </script>
 * ```
 */

import type { HyperMemoryClient } from "@hypermemory/core";
import { getContext } from "svelte";

export function useHyperMemory(): HyperMemoryClient {
	const ctx = getContext<{ readonly client: HyperMemoryClient }>("hypermemory-client");
	if (!ctx) {
		throw new Error(
			"useHyperMemory() must be used inside a <HyperMemoryProvider>. " +
				'Wrap your component tree with <HyperMemoryProvider apiKey="hm_...">.',
		);
	}
	return ctx.client;
}
