<script lang="ts">
	import { definitions } from '@inlang/database';
	import {
		Button,
		DataTable,
		PaginationNav,
		Tag,
		ProgressBar,
		Tooltip,
		Toolbar,
		ToolbarContent,
		ToolbarBatchActions,
		ToolbarSearch
	} from 'carbon-components-svelte';
	import Settings16 from 'carbon-icons-svelte/lib/Settings16';
	import Delete16 from 'carbon-icons-svelte/lib/Delete16';
	import LanguageModal from '$lib/components/modals/LanguageModal.svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import ISO6391 from 'iso-639-1';

	let showModifyLanguageModal = false;

	let showAddLanguageModal = false;

	/**
	 * Used to "communicate" with modal of which locale the
	 * settings button has been pressed.
	 */
	let selectedLanguageModifyModal: definitions['language']['iso_code'] | null = null;

	let selectedRowIds: any = [];

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
	function rows() {
		return $projectStore.data?.languages.map((language) => ({
			id: language.iso_code,
			name: language.iso_code,
			words: numWords(language.iso_code),
			progress: languageProgress(language.iso_code)
		}));
	}
</script>

<h1>Languages</h1>
<p class="text-gray-600 mt-1 mb-3">Your project's languages.</p>

<DataTable
	batchSelection
	bind:selectedRowIds
	headers={[
		{ key: 'name', value: 'Language' },
		{ key: 'words', value: 'Words' },
		{ key: 'progress', value: 'Progress' },
		{ key: 'settings', empty: true }
	]}
	rows={rows()}
>
	<Toolbar>
		<!-- Yes, the cancel button should be red too but haven't found a way to do so. -->
		<ToolbarBatchActions class="bg-danger">
			<Button icon={Delete16} kind="danger">Delete</Button>
		</ToolbarBatchActions>
		<ToolbarContent>
			<ToolbarSearch />
			<Button on:click={() => (showAddLanguageModal = true)}>Add language</Button>
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
		{#if cell.key === 'name'}
			<div class="flex items-center space-x-2">
				<p class="text-sm">{ISO6391.getName(cell.value)}</p>
				<Tag>{cell.value}</Tag>
				{#if cell.value === $projectStore.data?.project.default_language_iso}
					<Tag type="green">default</Tag>
				{/if}
			</div>
		{:else if cell.key === 'progress'}
			<ProgressBar value={cell.value} max={100} helperText={cell.value.toFixed() + '%'} />
		{:else if cell.key === 'settings'}
			<Button
				kind="ghost"
				icon={Settings16}
				iconDescription="Settings"
				on:click={() => {
					selectedLanguageModifyModal = row.id;
					showModifyLanguageModal = true;
				}}
			/>
		{:else}
			{cell.value}
		{/if}
	</span>
</DataTable>
<div class="mt-2 flex flex-row justify-center">
	<PaginationNav total={1} class="bottom" />
</div>

{#if showModifyLanguageModal && selectedLanguageModifyModal}
	<LanguageModal
		open={showModifyLanguageModal}
		primaryButtonDisabled={true}
		languageIso={selectedLanguageModifyModal}
		heading="Edit language"
	/>
{:else if showAddLanguageModal}
	<LanguageModal
		open={showAddLanguageModal}
		primaryButtonDisabled={true}
		languageIso=""
		heading="Add language"
	/>
{/if}
