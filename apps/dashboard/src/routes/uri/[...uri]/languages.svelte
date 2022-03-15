<script lang="ts">
	import {
		Button,
		DataTable,
		PaginationNav,
		Tag,
		Tooltip,
		Toolbar,
		ToolbarContent,
		ToolbarSearch
	} from 'carbon-components-svelte';

	import Delete16 from 'carbon-icons-svelte/lib/Delete16';
	import CreateLanguageModal from '$lib/components/modals/CreateLanguageModal.svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import ISO6391 from 'iso-639-1';
	import DeleteLanguageModal from '$lib/components/modals/DeleteLanguageModal.svelte';
	import Add16 from 'carbon-icons-svelte/lib/Add16';
	import { t } from '$lib/services/i18n';

	// all modals are interacted with as object which alllows to pass
	// values such as a language that should be deleted along.
	let createLanguageModal: { show: boolean } = { show: false };
	let deleteLanguageModal: { show: boolean; language?: any } = {
		show: false
	};

	// as entered in the search bar
	$: searchQuery = '';

	/**
	 * Calculates the progress based on number of reviewed translations.
	 *
	 * @returns percentage in xx.xx%
	 */
	/*function languageProgress(iso: definitions['language']['iso_code']) {
		if ($projectStore.data?.translations.getAllKeys().length === 0) {
			return 0;
		}
		const missingReview = allTranslations.filter(
			(translation) => translation.is_reviewed === false
		);
		return ((allTranslations.length - missingReview.length) / allTranslations.length) * 100;
	}*/

	// function numWords(iso: definitions['language']['iso_code']): number {
	// 	let result = 0;
	// 	if ($projectStore.data?.translations === undefined) {
	// 		throw 'TranslationAPI undefined';
	// 	}
	// 	const allKeys = $projectStore.data?.translations.getAllKeys();
	// 	if (allKeys?.isErr) {
	// 		throw allKeys.error;
	// 	}
	// 	for (const key of allKeys?.value) {
	// 		if ($projectStore.data?.translations === undefined) {
	// 			throw 'TranslationAPI undefined';
	// 		}
	// 		const allTranslations = $projectStore.data?.translations.getAllTranslations(key);
	// 		if (allTranslations?.isErr) {
	// 			throw allTranslations.error;
	// 		}
	// 		for (const translation of allTranslations?.value) {
	// 			result += (translation.translation?.split(' ') ?? []).length;
	// 		}
	// 	}
	// 	return result;
	// }

	const headers = [
		{ key: 'isoCode', value: 'Language' },
		// { key: 'progress', value: 'Progress' },
		// { key: 'words', value: 'Words' },
		{ key: 'actions', empty: true }
	];

	// rows needs to be reactive. Otherwise, the rows do not update
	// when projectStore.data changes or the search query
	$: rows = () => {
		return [];
		// let languages = $projectStore.data?.languages ?? [];
		// if (searchQuery !== '') {
		// 	languages = languages.filter((language) =>
		// 		ISO6391.getName(language.code).toLowerCase().startsWith(searchQuery.toLowerCase())
		// 	);
		// }
		// // sorted alphabetically
		// return languages
		// 	.map((language) => ({
		// 		id: language.code,
		// 		isoCode: language.code,
		// 		// words: numWords(language.iso_code),
		// 		// progress: 0,
		// 		isDefaultLanguage: language.code === $projectStore.data?.project.base_language_code,
		// 		languageObject: language
		// 	}))
		// 	.sort((a, b) => ISO6391.getName(a.isoCode).localeCompare(ISO6391.getName(b.isoCode)));
	};
</script>

<h1 class="mb-1">{$t('generic.language', { count: '2' })}</h1>
<p>{$t('info.languages')}</p>
<br />

<DataTable {headers} rows={rows()}>
	<Toolbar>
		<!-- Yes, the cancel button should be red too but haven't found a way to do so. -->
		<ToolbarContent>
			<ToolbarSearch bind:value={searchQuery} />
			<Button icon={Add16} on:click={() => (createLanguageModal.show = true)}
				>{$t('add.language')}</Button
			>
		</ToolbarContent>
	</Toolbar>
	<span slot="cell-header" let:header>
		{header.value}
	</span>
	<span slot="cell" let:row let:cell>
		{#if cell.key === 'isoCode'}
			<div class="flex items-center space-x-2">
				<p class="text-sm">{ISO6391.getName(cell.value)}</p>
				<Tag type="blue">{cell.value}</Tag>
				{#if row.isDefaultLanguage}
					<Tag type="green">{$t('human-base-language')}</Tag>
				{/if}
			</div>
		{:else if cell.key === 'actions'}
			<row class="justify-end">
				<Button
					kind="ghost"
					disabled={row.isDefaultLanguage}
					icon={Delete16}
					iconDescription={$t('delete.language')}
					tooltipAlignment="start"
					tooltipPosition="left"
					on:click={() => {
						deleteLanguageModal.language = row.languageObject;
						deleteLanguageModal.show = true;
					}}
				/>
			</row>
		{:else}
			{cell.value}
		{/if}
	</span>
</DataTable>
<div class="mt-2 flex flex-row justify-center">
	<PaginationNav total={1} class="bottom" />
</div>

<CreateLanguageModal
	bind:open={createLanguageModal.show}
	on:close={() => {
		createLanguageModal.show = false;
	}}
/>

{#if deleteLanguageModal.language}
	<DeleteLanguageModal
		bind:open={deleteLanguageModal.show}
		language={deleteLanguageModal.language}
		on:close={() => {
			deleteLanguageModal.show = false;
			// not setting language to undefined to animate
			// the model disappering which would be prevented
			// by a sudden removal of the modal html element
			// through the if statement
		}}
	/>
{/if}
