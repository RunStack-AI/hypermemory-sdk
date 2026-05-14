/**
 * React Context provider that initializes and provides the HyperMemory client
 * to all child components.
 *
 * @example
 * ```tsx
 * import { HyperMemoryProvider } from "@hypermemory/react";
 *
 * function App() {
 *   return (
 *     <HyperMemoryProvider apiKey="hm_your_key">
 *       <YourApp />
 *     </HyperMemoryProvider>
 *   );
 * }
 * ```
 */

import { useMemo, type ReactNode } from "react";
import { HyperMemoryClient } from "@hypermemory/core";
import { HyperMemoryContext } from "./context.js";

export interface HyperMemoryProviderProps {
	/** User API key (hm_*) */
	apiKey: string;
	/** Base URL override */
	baseUrl?: string;
	/** Max retry count */
	maxRetries?: number;
	/** Timeout in ms */
	timeout?: number;
	/** Child components */
	children: ReactNode;
}

export function HyperMemoryProvider({
	apiKey,
	baseUrl,
	maxRetries,
	timeout,
	children,
}: HyperMemoryProviderProps) {
	const client = useMemo(
		() => new HyperMemoryClient({ apiKey, baseUrl, maxRetries, timeout }),
		[apiKey, baseUrl, maxRetries, timeout],
	);

	return <HyperMemoryContext.Provider value={client}>{children}</HyperMemoryContext.Provider>;
}
