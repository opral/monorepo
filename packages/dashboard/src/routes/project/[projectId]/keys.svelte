<script lang="ts">
	import {
		Button,
		DataTable,
		PaginationNav,
		Toolbar,
		ToolbarBatchActions,
		ToolbarContent,
		ToolbarSearch,
		ExpandableTile
	} from 'carbon-components-svelte';
	import Edit32 from 'carbon-icons-svelte/lib/Edit32';
	import Delete16 from 'carbon-icons-svelte/lib/Delete16';
	import Add32 from 'carbon-icons-svelte/lib/Add32';
	import { List } from 'immutable';
	import TranslationModal from '$lib/components/modals/TranslationModal.svelte';
	import { onMount } from 'svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import CreateKeyModal from '$lib/components/modals/CreateKeyModal.svelte';
	import CreateBaseTranslationModal from '$lib/components/modals/createBaseTranslationModal.svelte';
	import { database } from '$lib/services/database';
	import type { definitions } from '@inlang/database';
	import { page } from '$app/stores';
	import Translations from '$lib/components/Translations.svelte';

	const headers = [
		{ key: 'key', value: 'Key' },
		{ key: 'description', value: 'Description' },
		{ key: 'overflow', empty: true }
	];

	let selectedRowIds;

	let search = '';
	let fullRows = [];

	$: rows = fullRows.filter((row) => row.key.indexOf(search) !== -1);

	let createTranslationModal = { open: false, translations: [], key: '' };
	let createKeyModal = { open: false, rows: fullRows, largestTableId: 0 };

	function openTranslationModal(translations: [], key: string) {
		const translationsImmutable = List(translations);
		createTranslationModal.translations = translationsImmutable.toJS();
		createTranslationModal.key = key;
		createTranslationModal.open = true;
	}

	let databaseReady = false;

	function updateRows() {
		fullRows = [];
		for (let i = 0; i < $projectStore.data.keys.length; i++) {
			let translations = [];
			for (let j = 0; j < $projectStore.data.languages.length; j++) {
				if (
					$projectStore.data.translations.some(
						(t) =>
							t.key_name === $projectStore.data.keys[i].name &&
							t.project_id === $projectStore.data.project.id &&
							t.iso_code === $projectStore.data.languages[j].iso_code
					)
				) {
					translations.push({
						key_name: $projectStore.data.keys[i].name,
						iso_code: $projectStore.data.languages[j].iso_code,
						is_reviewed: $projectStore.data.translations.filter(
							(t) =>
								t.key_name === $projectStore.data.keys[i].name &&
								t.project_id === $projectStore.data.project.id &&
								t.iso_code === $projectStore.data.languages[j].iso_code
						)[0].is_reviewed,
						text: $projectStore.data.translations.filter(
							(t) =>
								t.key_name === $projectStore.data.keys[i].name &&
								t.project_id === $projectStore.data.project.id &&
								t.iso_code === $projectStore.data.languages[j].iso_code
						)[0].text
					});
				} else {
					translations.push({
						key_name: $projectStore.data.keys[i].name,
						iso_code: $projectStore.data.languages[j].iso_code,
						is_reviewed: false,
						text: ''
					});
				}
			}
			fullRows.push({
				id: i,
				database_id: $projectStore.data.keys[i].id,
				key: $projectStore.data.keys[i].name,
				description: $projectStore.data.keys[i].description,
				translations: translations
			});
		}
		createKeyModal.largestTableId = $projectStore.data.keys.length;
		fullRows = fullRows; // Force update for reactive
	}

	onMount(async () => {
		await projectStore.getData({ projectId: $page.params.projectId });
		updateRows();
		databaseReady = true;
	});

	async function deleteKeys(rowIds) {
		let key;
		for (const rowId of rowIds) {
			key = fullRows.filter((element) => element.id === rowId)[0].key;
			const deleteReq = await database
				.from<definitions['key']>('key')
				.delete()
				.eq('name', key)
				.eq('project_id', $projectStore.data.project.id);
			if (deleteReq.error) {
				alert(deleteReq.error.message);
			} else {
				delete fullRows[rowId];
			}
		}
		fullRows = fullRows;
		selectedRowIds = [];
	}

	async function handleCreateKey(event) {
		await projectStore.getData({ projectId: $page.params.projectId });
		updateRows();
		console.log(event.detail);
		openBaseModal(event.detail);
	}

	async function handleUpdateRows() {
		await projectStore.getData({ projectId: $page.params.projectId });
		updateRows();
	}

	async function handleFinishBase(event) {
		await projectStore.getData({ projectId: $page.params.projectId });
		updateRows();
		openTranslationModal(
			$projectStore.data.translations.filter(
				(t) => t.key_name === event.detail && t.project_id === $projectStore.data.project.id
			),
			event.detail
		);
	}

	let createBaseTranslationModal = { open: false, key: '' };

	function openBaseModal(key: string) {
		createBaseTranslationModal.key = key;
		createBaseTranslationModal.open = true;
	}
</script>

<div class="p-8">
	<h1>Keys</h1>
	<p>All your translation keys will appear here. You can create, delete and edit them.</p>
</div>

<div style="padding-left: 2rem;padding-right:2rem">
	{#if databaseReady}
		<DataTable expandable bind:selectedRowIds {headers} {rows}>
			<Toolbar>
				<ToolbarBatchActions>
					<Button icon={Delete16} on:click={() => deleteKeys(selectedRowIds)}>Delete keys</Button>
				</ToolbarBatchActions>
				<ToolbarContent>
					<ToolbarSearch placeholder="Search your translations" bind:value={search} />
					<Button on:click={() => (createKeyModal.open = true)}>Create key</Button>
				</ToolbarContent>
			</Toolbar>

			<span slot="cell" let:row let:cell>
				{#if cell.key === 'overflow'}
					<!-- {#if row.translations.filter((t) => t.iso_code === $projectStore.data.project.default_iso_code)[0].text !== ''}
						<Button
							on:click={() => openTranslationModal(row.translations, row.key)}
							iconDescription="Modify translation"
							icon={Edit32}
							kind="ghost"
						/>
					{:else}
						<Button
							on:click={() => openBaseModal(row.key)}
							iconDescription="Add base translation"
							icon={Add32}
							kind="ghost"
						/>
					{/if} -->
				{:else}{cell.value}{/if}
			</span>
			<div slot="expanded-row" let:row>
				<Translations keyName={row.key} />
			</div>
		</DataTable>
	{/if}
</div>
<div class="mt-2 flex flex-row justify-center">
	<PaginationNav total={1} class="bottom" />
</div>

<TranslationModal
	bind:open={createTranslationModal.open}
	translations={createTranslationModal.translations}
	key={createTranslationModal.key}
	on:updateRows={handleUpdateRows}
/>
<CreateKeyModal
	bind:open={createKeyModal.open}
	rows={createKeyModal.rows}
	largestTableId={createKeyModal.largestTableId}
	on:createKey={handleCreateKey}
/>
<CreateBaseTranslationModal
	bind:open={createBaseTranslationModal.open}
	key={createBaseTranslationModal.key}
	on:finishBase={handleFinishBase}
/>
