<script lang="ts">
	import {
		Button,
		DataTable,
		Toolbar,
		ToolbarContent,
		ToolbarSearch,
		Tag,
		Pagination
	} from 'carbon-components-svelte';
	import Delete16 from 'carbon-icons-svelte/lib/Delete16';
	import TranslationModal from '$lib/components/modals/TranslationModal.svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import CreateKeyModal from '$lib/components/modals/CreateKeyModal.svelte';
	import DeleteKeyModal from '$lib/components/modals/DeleteKeyModal.svelte';
	import type { definitions } from '@inlang/database';
	import Translations from '$lib/components/Translations.svelte';
	import { LanguageCode } from '@inlang/common/src/types/languageCode';
	import Add16 from 'carbon-icons-svelte/lib/Add16';

	const ff = $projectStore.data?.translations.getFluentFiles();
	if (ff?.isOk) console.log(ff.value);

	const headers = [
		{ key: 'key', value: 'Key' },
		{ key: 'actions', empty: true }
	];

	type Row = {
		key: string;
		translations: { languageCode: LanguageCode; translation: string | null }[];
	};

	let searchQuery = '';
	let pageSize = 10;
	let pageNumber = 1;

	let deleteKeyModal: DeleteKeyModal;
	let createKeyModal: CreateKeyModal;

	// define the type of rows to be a function that returns an array of row
	let rows: () => Row[];
	// the actual function
	$: rows = () => {
		let result: Row[] = [];
		let allKeys;
		if ((allKeys = $projectStore.data?.translations.getAllKeys())?.isErr) {
			throw allKeys.error;
		}
		for (const key of allKeys?.value ?? []) {
			let allTranslations;
			if ((allTranslations = $projectStore.data?.translations.getAllTranslations(key))?.isErr) {
				throw allTranslations.error;
			}
			result.push({
				key: key,
				translations: allTranslations?.value ?? []
			});
		}

		if (searchQuery !== '') {
			result = result?.filter((row) => row.key.startsWith(searchQuery));
		}
		// return an empty array as fallback
		return result?.reverse() ?? [];
	};

	let displayedRows: () => Row[];

	$: displayedRows = () => {
		return rows()?.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
	};

	// $: rows = fullRows.filter((row) => row.key.indexOf(searchQuery) !== -1);

	// check if for this key there is a translation for each of the languages in the project
	function keyIsMissingTranslations(row: unknown): boolean {
		// type casting row as Row
		// (parameter must be any due to sveltes limited ts support in markup)
		const x = row as Row;
		const numberOfLanguages = $projectStore.data?.languages.length;
		const numberOfTranslations = x.translations.filter(
			(t) => t.translation !== '' || t.translation !== null
		).length;
		return numberOfLanguages !== numberOfTranslations;
	}

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

	let createTranslationModal: {
		open: boolean;
		translations: { languageCode: LanguageCode; translation: string }[];
		key: string;
	} = {
		open: false,
		translations: [],
		key: ''
	};
</script>

<h1>Keys</h1>
<p>All your translation keys will appear here. You can create, delete and edit them.</p>
<br />
<DataTable expandable {headers} rows={displayedRows()}>
	<Toolbar>
		<ToolbarContent>
			<ToolbarSearch placeholder="Search for a specific key" bind:value={searchQuery} />
			<Button
				icon={Add16}
				on:click={() => {
					createKeyModal.show();
				}}>Create key</Button
			>
		</ToolbarContent>
	</Toolbar>
	<span slot="cell" let:row let:cell>
		{#if cell.key === 'actions'}
			<row class="justify-end items-center">
				<!-- Status  -->
				<div>
					{#if keyIsMissingTranslations(row) === true}
						<Tag type="red">Missing translation</Tag>
						<!--{:else if keyIsFullyReviewed(row) === false}
						<Tag type="purple">Needs approval</Tag>-->
					{:else}
						<Tag type="cool-gray">Complete</Tag>
					{/if}
				</div>
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
			{cell.value.key}
		{/if}
	</span>
	<div slot="expanded-row" let:row>
		<Translations keyName={row.key.name} />
	</div>
</DataTable>
<Pagination
	totalItems={rows().length}
	pageSizes={[10, 25, 50]}
	bind:pageSize
	bind:page={pageNumber}
/>

<TranslationModal
	bind:open={createTranslationModal.open}
	translations={createTranslationModal.translations}
	key={createTranslationModal.key}
/>

<CreateKeyModal bind:this={createKeyModal} />

<DeleteKeyModal bind:this={deleteKeyModal} />
