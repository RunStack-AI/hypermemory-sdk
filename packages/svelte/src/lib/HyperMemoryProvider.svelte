<script lang="ts">
import { HyperMemoryClient } from "@runstack-ai/hypermemory-core";
import { setContext } from "svelte";

interface Props {
	apiKey: string;
	baseUrl?: string;
	maxRetries?: number;
	timeout?: number;
	onRequest?: (method: string, url: string, status: number, durationMs: number) => void;
	children: import("svelte").Snippet;
}

const { apiKey, baseUrl, maxRetries, timeout, onRequest, children }: Props = $props();

const client = $derived(
	new HyperMemoryClient({
		apiKey,
		baseUrl,
		maxRetries,
		timeout,
		onRequest,
	}),
);

setContext("hypermemory-client", {
	get client() {
		return client;
	},
});
</script>

{@render children()}
