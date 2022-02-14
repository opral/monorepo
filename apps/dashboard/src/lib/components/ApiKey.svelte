<script lang="ts">
	import type { definitions } from '@inlang/database';
	import { Button, CodeSnippet } from 'carbon-components-svelte';
	import View16 from 'carbon-icons-svelte/lib/View16';
	import ViewOff16 from 'carbon-icons-svelte/lib/ViewOff16';
	import { t } from '$lib/services/i18n';

	export let apiKey: definitions['project']['api_key'];

	let isRevealed = false;

	$: text = isRevealed ? apiKey : apiKey.replace(/./g, '*');
</script>

<p class="pt-1">API key</p>
<p class="pt-1 text-gray-600 text-sm">
	{$t('info.api-key')}
</p>
<br />
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
