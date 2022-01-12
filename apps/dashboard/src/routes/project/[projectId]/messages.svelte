<script lang="ts">
	import { Button, Search } from 'carbon-components-svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import CreateMessageModal from '$lib/components/modals/CreateMessageModal.svelte';

	import Add16 from 'carbon-icons-svelte/lib/Add16';
	import { Message } from '@inlang/fluent-syntax';
	import { LanguageCode } from '@inlang/common';
	// called MessageComponent to not conflict with `Message` type.
	import MessageComponent from '$lib/components/Message.svelte';

	let searchQuery = '';

	let createMessageModal: CreateMessageModal;

	type Row = {
		id: string;
		messages: Record<LanguageCode, Message | undefined>;
	};
	let rows: () => Row[];
	$: rows = () => {
		const result: Row[] = [];
		const ids = $projectStore.data?.resources.getMessageIds({
			languageCode: $projectStore.data.project.default_iso_code
		});
		const filtered = [...(ids ?? [])].filter((id) => id.startsWith(searchQuery));
		for (const id of filtered) {
			const messages = $projectStore.data?.resources.getMessageForAllResources({ id }) ?? {};
			result.push({ id, messages });
		}
		return result;
	};
</script>

<!-- description -->
<h1>Messages</h1>
<p>All your messages will appear here. You can create, delete and edit them.</p>
<br />
<!-- "action bar" -->
<row class="min-w-0">
	<Search bind:value={searchQuery} />
	<Button
		kind="secondary"
		icon={Add16}
		on:click={() => {
			createMessageModal.show();
		}}
	>
		New attribute
	</Button>
	<Button
		icon={Add16}
		on:click={() => {
			createMessageModal.show();
		}}>New message</Button
	>
</row>
<!-- divider -->
<row class="bg-gray-300 w-full h-12 items-center">
	<strong class="pl-12">Id</strong>
</row>
<!-- messages -->
{#each rows() as row, i}
	<MessageComponent
		messages={row.messages}
		requiredLanguageCodes={$projectStore.data?.languages.map((language) => language.iso_code) ?? []}
		sourceLanguageCode={$projectStore.data?.project.default_iso_code ?? 'en'}
	/>
	{#if i + 1 < rows().length}
		<div class="h-px w-full bg-gray-200" />
	{/if}
{/each}

<!-- modals -->
<CreateMessageModal bind:this={createMessageModal} />
