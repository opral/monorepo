<script lang="ts">
	import {
		Button,
		DataTable,
		Toolbar,
		ToolbarContent,
		ToolbarSearch,
		Pagination,
		ToolbarMenuItem,
		ToolbarMenu
	} from 'carbon-components-svelte';
	import Delete16 from 'carbon-icons-svelte/lib/Delete16';
	import { projectStore } from '$lib/stores/projectStore';
	import CreateMessageModal from '$lib/components/modals/CreateMessageModal.svelte';
	import DeleteKeyModal from '$lib/components/modals/DeleteKeyModal.svelte';
	import Translations from '$lib/components/Translations.svelte';
	import Add16 from 'carbon-icons-svelte/lib/Add16';
	import Language16 from 'carbon-icons-svelte/lib/Language16';
	import { Message } from '@inlang/fluent-syntax';

	const headers = [
		{ key: 'id', value: 'Key' },
		{ key: 'actions', empty: true }
	];

	type Row = {
		id: string;
		values: Record<string, Message | undefined>;
	};

	let searchQuery = '';
	let pageSize = 10;
	let pageNumber = 1;

	let deleteKeyModal: DeleteKeyModal;
	let createMessageModal: CreateMessageModal;

	// define the type of rows to be a function that returns an array of row
	let rows: () => Row[];
	// the actual function
	$: rows = () => {
		const result: Row[] = [];
		const allIds = $projectStore.data?.resources.getMessageIdsForAllResources();
		for (const id of allIds ?? []) {
			const values = $projectStore.data?.resources.getMessageForAllResources({ id }) ?? {};
			result.push({ id, values });
		}
		return result;
	};

	let displayedRows: () => Row[];

	$: displayedRows = () => {
		return rows()?.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
	};

	// $: rows = fullRows.filter((row) => row.key.indexOf(searchQuery) !== -1);

	// check if for this key there is a translation for each of the languages in the project
	// function keyIsMissingTranslations(row: unknown): boolean {
	// 	// type casting row as Row
	// 	// (parameter must be any due to sveltes limited ts support in markup)
	// 	const x = row as Row;
	// 	const numberOfLanguages = $projectStore.data?.languages.length;
	// 	const numberOfTranslations = x.values.filter((t) => t.translation && t.translation !== '')
	// 		.length;
	// 	return numberOfLanguages !== numberOfTranslations;
	// }

	/*function keyIsFullyReviewed(row: unknown): boolean {
		// type casting row as Row
		// (parameter must be any due to sveltes limited ts support in markup)
		const x = row as Row;
		const allTranslationsOfKey = $projectStore.data?.translations.getAllTranslations();
		const missingReviews = allTranslationsOfKey.filter(
			(translation) => translation.is_reviewed === false
		);
		return missingReviews.length === 0;
	}*/

	// function keyIsMissingVariable(row: unknown): boolean {
	// 	const x = row as Row;
	// 	const missingVariables = $projectStore.data?.translations.checkMissingVariables();
	// 	if (missingVariables === undefined) throw 'Missing variables undefined';
	// 	if (missingVariables?.isErr) throw missingVariables.error;
	// 	for (const key of missingVariables.value) {
	// 		if (key.key === x.key) {
	// 			return true;
	// 		}
	// 	}
	// 	return false;
	// }
</script>

<h1>Messages</h1>
<p>All your messages will appear here. You can create, delete and edit them.</p>
<br />
<DataTable expandable {headers} rows={displayedRows()}>
	<Toolbar>
		<ToolbarContent>
			<ToolbarSearch placeholder="Search for a specific key" bind:value={searchQuery} />
			<ToolbarMenu>
				<ToolbarMenuItem>Show missing translation</ToolbarMenuItem>
				<ToolbarMenuItem>Show missing variables</ToolbarMenuItem>
			</ToolbarMenu>
			<Button
				icon={Add16}
				on:click={() => {
					createMessageModal.show();
				}}>Create key</Button
			>
		</ToolbarContent>
	</Toolbar>
	<span slot="cell" let:row let:cell>
		{#if cell.key === 'actions'}
			<row class="justify-end items-center">
				<!-- Human translator -->
				<!-- {#if keyIsMissingTranslations(row)} -->
				<Button
					icon={Language16}
					iconDescription="Send to translator"
					kind="ghost"
					tooltipAlignment="start"
					tooltipPosition="left"
				/>
				<!-- {/if} -->
				<!-- Status  -->
				<!-- <div>
					{#if keyIsMissingTranslations(row) === true}
						<Tag type="red">Action Required</Tag>
						{:else if keyIsFullyReviewed(row) === false}
						<Tag type="purple">Needs approval</Tag>
					{:else if keyIsMissingVariable(row)}
						<Tag type="red">Action Required</Tag>
					{:else}
						<Tag type="cool-gray">Complete</Tag>
					{/if}
				</div> -->
				<!-- Delete Action -->
				<Button
					on:click={() => {
						deleteKeyModal.show({ key: row.key });
					}}
					iconDescription="Delete translation"
					kind="ghost"
					icon={Delete16}
					tooltipAlignment="start"
					tooltipPosition="left"
				/>
			</row>
		{:else}
			{cell.value}
		{/if}
	</span>
	<div class="pb-4" slot="expanded-row" let:row>
		<Translations keyName={row.id} />
	</div>
</DataTable>
<Pagination
	totalItems={rows().length}
	pageSizes={[10, 25, 50]}
	bind:pageSize
	bind:page={pageNumber}
/>

<!-- <TranslationModal
	bind:open={createTranslationModal.open}
	translations={createTranslationModal.translations}
	key={createTranslationModal.key}
/> -->

<CreateMessageModal bind:this={createMessageModal} />

<DeleteKeyModal bind:this={deleteKeyModal} />
