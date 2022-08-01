<script context="module" lang="ts">
	import { loadResources } from '$lib/services/i18n';
	import type { LoadInput, LoadOutput } from '@sveltejs/kit';
	export async function load({ fetch }: LoadInput): Promise<LoadOutput> {
		// fetching the translations with sveltekits load function https://kit.svelte.dev/docs/migrating#pages-and-layouts-preload
		await loadResources({ fetch });
		return {
			status: 200
		};
	}
</script>

<!-- 
	This layout acts as authentification layer. 
-->
<script lang="ts">
	import { capitalize, last } from 'lodash-es';
	import '../app.postcss';
	import UiShell from '$lib/layout/UiShell.svelte';
	import { page } from '$app/stores';
	import { InlineNotification } from 'carbon-components-svelte';
	import { t } from '$lib/services/i18n';

	$: outerWidth = 0;
</script>

<svelte:head>
	{#if $page.params.projectId}
		<title>inlang | {capitalize(last($page.url.href.split('/')))}</title>
	{:else}
		<title>inlang</title>
	{/if}
</svelte:head>

<svelte:window bind:outerWidth />

<UiShell>
	<slot />
	{#if outerWidth < 550}
		<InlineNotification
			kind="warning"
			title="Notice:"
			subtitle={$t('warning.no-optimized-for-mobile')}
			hideCloseButton={false}
		/>
	{/if}
</UiShell>
