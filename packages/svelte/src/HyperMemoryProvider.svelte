<script lang="ts">
	import { setContext } from "svelte";
	import { HyperMemoryClient, type ClientOptions } from "@hypermemory/core";

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
		})
	);

	$effect(() => {
		setContext("hypermemory-client", client);
	});

	setContext("hypermemory-client", client);
</script>

{@render children()}
