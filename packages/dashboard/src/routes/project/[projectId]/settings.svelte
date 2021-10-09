<script lang="ts">
	import { projectStore } from '$lib/stores/projectStore';
	import { CodeSnippet } from 'carbon-components-svelte';
	import { auth } from '$lib/services/auth';

	import { onMount } from 'svelte';

	let token = '';

	onMount(async () => {
		token = auth.session()!.access_token;
	});
</script>

<row class="space-x-4 items-center">
	<p>Project ID:</p>
	<CodeSnippet>{$projectStore.data?.project.id}</CodeSnippet>
</row>

<row class="space-x-4 items-center">
	<p>Token:</p>
	<CodeSnippet bind:code={token} />
</row>
