<script lang="ts">
import { HyperMemoryClient } from "@hypermemory/core";
import { setContext } from "svelte";

interface Props {
	apiKey: string;
	baseUrl?: string;
	maxRetries?: number;
	timeout?: number;
	children: import("svelte").Snippet;
}

const { apiKey, baseUrl, maxRetries, timeout, children }: Props = $props();

const client = $derived(
	new HyperMemoryClient({
		apiKey,
		baseUrl,
		maxRetries,
		timeout,
	}),
);

setContext("hypermemory-client", {
	get client() {
		return client;
	},
});
</script>

{@render children()}
