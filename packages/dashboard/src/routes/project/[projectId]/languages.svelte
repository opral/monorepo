<script lang="ts">
	import type { definitions } from '@inlang/database';
	import {
		Button,
		DataTable,
		PaginationNav,
		Tag,
		ProgressBar,
		Tooltip,
		Toolbar,
		ToolbarContent,
		ToolbarSearch
	} from 'carbon-components-svelte';
	import Save16 from 'carbon-icons-svelte/lib/Save16';

	import Delete16 from 'carbon-icons-svelte/lib/Delete16';
	import CreateLanguageModal from '$lib/components/modals/CreateLanguageModal.svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import ISO6391 from 'iso-639-1';
	import SetDefaultLanguageModal from '$lib/components/modals/SetDefaultLanguageModal.svelte';
	import DeleteLanguageModal from '$lib/components/modals/DeleteLanguageModal.svelte';

	// all modals are interacted with as object which alllows to pass
	// values such as a language that should be deleted along.
	let createLanguageModal: { show: boolean } = { show: false };
	let deleteLanguageModal: { show: boolean; language?: definitions['language'] } = {
		show: false
	};
	let setDefaultLanguageModal: { show: boolean; language?: definitions['language'] } = {
		show: false
	};

	// as entered in the search bar
	$: searchQuery = '';

	/**
	 * Calculates the progress based on number of reviewed translations.
	 *
	 * @returns percentage in xx.xx%
	 */
	function languageProgress(iso: definitions['language']['iso_code']) {
		const allTranslations =
			$projectStore.data?.translations.filter((translation) => translation.language_iso === iso) ??
			[];
		const missingReview = allTranslations.filter(
			(translation) => translation.is_reviewed === false
		);
		return ((allTranslations.length - missingReview.length) / allTranslations.length) * 100;
	}

	function numWords(iso: definitions['language']['iso_code']): number {
		let result = 0;
		$projectStore.data?.translations
			.filter((translation) => translation.language_iso === iso)
			.forEach((translation) => {
				result += (translation.text.split(' ') ?? []).length;
			});
		return result;
	}

	const headers = [
		{ key: 'isoCode', value: 'Language' },
		{ key: 'progress', value: 'Progress' },
		{ key: 'words', value: 'Words' },
		{ key: 'actions', empty: true }
	];

	// rows needs to be reactive. Otherwise, the rows do not update
	// when projectStore.data changes or the search query
	$: rows = () => {
		let languages = $projectStore.data?.languages ?? [];
		if (searchQuery !== '') {
			languages = languages.filter((language) =>
				ISO6391.getName(language.iso_code).toLowerCase().startsWith(searchQuery.toLowerCase())
			);
		}
		// sorted alphabetically
		return languages
			.map((language) => ({
				id: language.iso_code,
				isoCode: language.iso_code,
				words: numWords(language.iso_code),
				progress: languageProgress(language.iso_code),
				isDefaultLanguage: language.iso_code === $projectStore.data?.project.default_language_iso,
				languageObject: language
			}))
			.sort((a, b) => ISO6391.getName(a.isoCode).localeCompare(ISO6391.getName(b.isoCode)));
	};
</script>

<h1>Languages</h1>
<p class="text-gray-600 mt-1 mb-3">Your project's languages.</p>

<DataTable {headers} rows={rows()}>
	<Toolbar>
		<!-- Yes, the cancel button should be red too but haven't found a way to do so. -->
		<ToolbarContent>
			<ToolbarSearch bind:value={searchQuery} />
			<Button on:click={() => (createLanguageModal.show = true)}>Add language</Button>
		</ToolbarContent>
	</Toolbar>
	<span slot="cell-header" let:header>
		{#if header.key === 'progress'}
			<div class="flex items-center">
				<p class="text-sm font-semibold">{header.value}</p>
				<Tooltip class="pt-1.5">
					<p>The percentage of reviewed translations.</p>
				</Tooltip>
			</div>
		{:else}
			{header.value}
		{/if}
	</span>
	<span slot="cell" let:row let:cell>
		{#if cell.key === 'isoCode'}
			<div class="flex items-center space-x-2">
				<p class="text-sm">{ISO6391.getName(cell.value)}</p>
				<Tag>{cell.value}</Tag>
				{#if cell.value === $projectStore.data?.project.default_language_iso}
					<Tag type="green">default</Tag>
				{/if}
			</div>
		{:else if cell.key === 'progress'}
			<ProgressBar value={cell.value} max={100} helperText={cell.value.toFixed() + '%'} />
		{:else if cell.key === 'actions'}
			<row class="flex-shrink">
				{#if row.isDefaultLanguage === false}
					<Button
						kind="ghost"
						icon={Save16}
						iconDescription="Set as default language"
						color="green"
						on:click={() => {
							setDefaultLanguageModal.language = row.languageObject;
							setDefaultLanguageModal.show = true;
						}}
					/>
				{:else}
					<!-- ugly trick to align the delete button if the language is the default -->
					<div class="w-12" />
				{/if}
				<Button
					kind="danger-ghost"
					disabled={row.isDefaultLanguage}
					icon={Delete16}
					iconDescription="Delete language"
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

{#if setDefaultLanguageModal.language}
	<SetDefaultLanguageModal
		bind:open={setDefaultLanguageModal.show}
		language={setDefaultLanguageModal.language}
		on:close={() => {
			setDefaultLanguageModal.show = false;
			// not setting language to undefined to animate
			// the model disappering which would be prevented
			// by a sudden removal of the modal html element
			// through the if statement
		}}
	/>
{/if}

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
