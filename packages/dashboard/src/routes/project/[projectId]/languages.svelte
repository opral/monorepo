<script lang="ts">
	import {
		Button,
		Search,
		DataTable,
		PaginationNav,
		Tag,
		ProgressBar,
		Tooltip,
		Toolbar,
		ToolbarMenu,
		ToolbarContent,
		ToolbarBatchActions,
		ToolbarSearch,
		ToolbarMenuItem
	} from 'carbon-components-svelte';
	import { mockProject } from '$lib/mockData';
	import Settings16 from 'carbon-icons-svelte/lib/Settings16';
	import Delete16 from 'carbon-icons-svelte/lib/Delete16';

	import LanguageModal from '$lib/components/modals/LanguageModal.svelte';

	let showModifyLanguageModal = false;

	let showAddLanguageModal = false;

	/**
	 * Used to "communicate" with modal of which locale the
	 * settings button has been pressed.
	 */
	let selectedLanguageModifyModal: string | null = null;

	let selectedRowIds: any = [];

	function localeProgress() {
		return Math.random() * 100;
	}

	function numWords(locale: string): number {
		let result = 0;
		Object.values(mockProject.translations[locale] ?? {}).forEach((string) => {
			result += (string?.split(' ') ?? []).length;
		});
		return result;
	}
	function rows() {
		return mockProject.locales.map((locale) => ({
			id: locale,
			name: locale,
			words: numWords(locale),
			progress: localeProgress()
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
				<p class="text-sm">Placeholder</p>
				<Tag>{cell.value}</Tag>
				{#if cell.value === mockProject.defaultLocale}
					<Tag type="green">default</Tag>
				{/if}
			</div>
		{:else if cell.key === 'progress'}
			<ProgressBar
				value={localeProgress()}
				max={100}
				helperText={localeProgress().toFixed() + '%'}
			/>
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
		languageCode={selectedLanguageModifyModal}
		heading="Edit language"
	/>
{:else if showAddLanguageModal}
	<LanguageModal
		open={showAddLanguageModal}
		primaryButtonDisabled={true}
		languageCode=""
		heading="Add language"
	/>
{/if}
