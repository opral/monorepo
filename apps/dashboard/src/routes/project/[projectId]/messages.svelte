<script lang="ts">
	import { Button, Search } from 'carbon-components-svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import CreateMessageModal from '$lib/components/modals/CreateMessageModal.svelte';

	import Add16 from 'carbon-icons-svelte/lib/Add16';
	import { Message } from '@inlang/fluent-syntax';
	import { LanguageCode } from '@inlang/common';
	// called MessageComponent to not conflict with `Message` type.
	import MessageComponent from '$lib/components/Message.svelte';
	import { lowerCase } from 'lodash-es';
	import { lintPattern } from '@inlang/fluent-lint';

	let searchQuery = '';

	let createMessageModal: CreateMessageModal;

	type Row = {
		id: string;
		messages: Record<LanguageCode, Message | undefined>;
		actionRequired: boolean;
	};
	let rows: () => Row[];
	$: rows = () => {
		const result: Row[] = [];
		const ids = $projectStore.data?.resources.getMessageIds({
			languageCode: $projectStore.data.project.default_iso_code
		});
		const filtered = [...(ids ?? [])].filter((id) =>
			lowerCase(id).startsWith(lowerCase(searchQuery))
		);
		for (const id of filtered) {
			const messages = $projectStore.data?.resources.getMessageForAllResources({ id }) ?? {};
			result.push({ id, messages, actionRequired: isActionRequired({ messages }) });
		}
		return result;
	};

	/**
	 * Determines whether or not the message or attribute requires action.
	 */
	function isActionRequired(args: {
		messages: Record<LanguageCode, Message | undefined>;
	}): boolean {
		const sourceLanguageCode = $projectStore.data?.resources.baseLanguageCode ?? 'en';
		const sourceMessage = args.messages[sourceLanguageCode];
		if (sourceMessage === undefined || sourceMessage?.value === null) {
			return true;
		}
		for (const [languageCode, message] of Object.entries(args.messages)) {
			if (languageCode === sourceLanguageCode) {
				continue;
			}
			if (message?.value) {
				const lint = lintPattern({ source: sourceMessage.value, target: message.value });
				if (lint.isErr) {
					return true;
				}
			} else {
				return true;
			}
		}
		return false;
	}
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
		displayActionRequired={row.actionRequired}
		requiredLanguageCodes={$projectStore.data?.languages.map((language) => language.iso_code) ?? []}
		sourceLanguageCode={$projectStore.data?.project.default_iso_code ?? 'en'}
	/>
	{#if i + 1 < rows().length}
		<div class="h-px w-full bg-gray-200" />
	{/if}
{/each}

<!-- modals -->
<CreateMessageModal bind:this={createMessageModal} />
