"use client";

/**
 * React hook for accessing the HyperMemory client from context.
 *
 * Must be used inside a `<HyperMemoryProvider>` tree.
 *
 * Note: The provider creates a new `HyperMemoryClient` when `apiKey`, `baseUrl`,
 * `maxRetries`, `timeout`, or `onRequest` change. Components that need the latest
 * client should call `useHyperMemory()` on every render rather than caching the
 * result in a `useRef` or module-level variable.
 *
 * @example
 * ```tsx
 * import { useHyperMemory } from "@hypermemory/react";
 *
 * function MyComponent() {
 *   const hm = useHyperMemory();
 *
 *   const handleSearch = async () => {
 *     const results = await hm.recall({ query: "react" });
 *     console.log(results);
 *   };
 *
 *   return <button onClick={handleSearch}>Search</button>;
 * }
 * ```
 */

import type { HyperMemoryClient } from "@hypermemory/core";
import { useContext } from "react";
import { HyperMemoryContext } from "./context.js";

export function useHyperMemory(): HyperMemoryClient {
	const client = useContext(HyperMemoryContext);
	if (!client) {
		throw new Error(
			"useHyperMemory() must be used inside a <HyperMemoryProvider>. " +
				'Wrap your component tree with <HyperMemoryProvider apiKey="hm_...">.',
		);
	}
	return client;
}
