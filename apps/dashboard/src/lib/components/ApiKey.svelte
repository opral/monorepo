<script lang="ts">
	import type { definitions } from '@inlang/database';
	import { Button, CodeSnippet } from 'carbon-components-svelte';
	import View16 from 'carbon-icons-svelte/lib/View16';
	import ViewOff16 from 'carbon-icons-svelte/lib/ViewOff16';

	export let apiKey: definitions['project']['api_key'];

	let isRevealed = false;

	$: text = isRevealed ? apiKey : apiKey.replace(/./g, '*');
</script>

<p class="pt-1">API key</p>
<p class="pt-1 pb-2 text-gray-600 text-sm">
	If you are not a developer, you won't need the API key. The API key can be used to make requests
	with the CLI. Don't share the key with anyone who should not have access to this project.
</p>
<row>
	<CodeSnippet code={text} />
	{#if isRevealed}
		<Button
			size="field"
			kind="secondary"
			iconDescription="Hide"
			icon={ViewOff16}
			on:click={() => (isRevealed = false)}
		/>
	{:else}
		<Button
			size="field"
			kind="secondary"
			iconDescription="Reveal"
			icon={View16}
			on:click={() => (isRevealed = true)}
		/>
	{/if}
</row>
