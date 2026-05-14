/**
 * Svelte 5 runes-based composable for accessing the HyperMemory client.
 *
 * Must be called inside a component tree wrapped by `<HyperMemoryProvider>`.
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
