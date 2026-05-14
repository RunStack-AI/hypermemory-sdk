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

import { getContext } from "svelte";
import type { HyperMemoryClient } from "@hypermemory/core";

export function useHyperMemory(): HyperMemoryClient {
	const client = getContext<HyperMemoryClient>("hypermemory-client");
	if (!client) {
		throw new Error(
			"useHyperMemory() must be used inside a <HyperMemoryProvider>. " +
				"Wrap your component tree with <HyperMemoryProvider apiKey=\"hm_...\">.",
		);
	}
	return client;
}
