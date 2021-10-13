<script lang="ts">
	import { InlineLoading, Modal, TextArea } from 'carbon-components-svelte';
	import type { CreateBaseTranslationRequestBody } from '../../../routes/api/internal/create-base-translation';
	import { projectStore } from '$lib/stores/projectStore';
	import type { definitions } from '@inlang/database';
	import { createEventDispatcher } from 'svelte';
	import { page } from '$app/stores';

	export let open;
	export let key;

	let translation;
	const dispatch = createEventDispatcher();
	let isLoading = 0;

</script>

<Modal
	bind:open
	modalHeading={key}
	size="sm"
	primaryButtonText="Approve"
	secondaryButtonText="Cancel"
	on:click:button--secondary={() => {
		open = false;
	}}
	on:submit={() => {
		handleTranslation(translation);
	}}
	preventCloseOnClickOutside
	shouldSubmitOnEnter={false}
>
	<div class="flex items-center">
		<TextArea labelText="Base translation:" bind:value={translation} />
	</div>
	<p>Text is automatically translated to all project languages.</p>
	{#if isLoading === 1}
		<InlineLoading status="active" description="Auto-translating..." />
	{:else if isLoading === -1}
		<InlineLoading status="error" description="Auto-translating failed" />
	{:else if isLoading === 2}
		<InlineLoading status="finished" description="Auto-translating..." />
		<InlineLoading status="active" description="Submitting..." />
	{:else if isLoading === -2}
		<InlineLoading status="finished" description="Auto-translating..." />
		<InlineLoading status="error" description="Submitting failed" />
	{:else if isLoading === 3}
		<InlineLoading status="finished" description="Auto-translating..." />
		<InlineLoading status="finished" description="Submitting..." />
	{/if}
</Modal>
