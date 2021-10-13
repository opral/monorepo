<script lang="ts">
	import {
		Button,
		DataTable,
		PaginationNav,
		Toolbar,
		ToolbarBatchActions,
		ToolbarContent,
		ToolbarSearch
	} from 'carbon-components-svelte';
	import Edit32 from 'carbon-icons-svelte/lib/Edit32';
	import Delete16 from 'carbon-icons-svelte/lib/Delete16';
	import Add32 from 'carbon-icons-svelte/lib/Add32';
	import { List } from 'immutable';
	import TranslationModal from '$lib/components/modals/TranslationModal.svelte';
	import { onMount } from 'svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import CreateKeyModal from '$lib/components/modals/CreateKeyModal.svelte';
	import CreateBaseTranslationModal from '$lib/components/modals/CreateBaseTranslationModal.svelte';
	import { database } from '$lib/services/database';
	import type { definitions } from '@inlang/database';
	import { page } from '$app/stores';

	const headers = [
		{ key: 'key', value: 'Key' },
		{ key: 'description', value: 'Description' },
		{ key: 'overflow', empty: true }
	];

	type row = {
		id: number;
		key: string;
		description: string;
		translations: translation[];
	};

	let selectedRowIds: number[];

	let search: string = '';
	let fullRows: row[] = [];

	type translation = definitions['translation'];

	$: rows = fullRows.filter((row: row) => row.key.indexOf(search) !== -1);

	let createTranslationModal: { open: boolean; translations: List<translation[]>; key: string } = {
		open: false,
		translations: [],
		key: ''
	};
	let createKeyModal: { open: boolean } = { open: false };

	function openTranslationModal(translations: translation[], key: string) {
		const translationsImmutable = List(translations);
		createTranslationModal.translations = translationsImmutable.toJS();
		createTranslationModal.key = key;
		createTranslationModal.open = true;
	}

	let databaseReady = false;

	function updateRows() {
		fullRows = [];
		for (let i = 0; i < ($projectStore.data?.keys.length ?? 0); i++) {
			let translations: translation[] = [];
			for (let j = 0; j < ($projectStore.data?.languages.length ?? 0); j++) {
				if (
					$projectStore.data?.translations.some(
						(t: translation) =>
							t.key_name === $projectStore.data?.keys[i].name &&
							t.project_id === $projectStore.data?.project.id &&
							t.iso_code === $projectStore.data?.languages[j].iso_code
					)
				) {
					translations.push({
						key_name: $projectStore.data?.keys[i].name,
						project_id: $projectStore.data?.project.id,
						iso_code: $projectStore.data?.languages[j].iso_code,
						created_at: '',
						is_reviewed: $projectStore.data?.translations.filter(
							(t: translation) =>
								t.key_name === $projectStore.data?.keys[i].name &&
								t.project_id === $projectStore.data?.project.id &&
								t.iso_code === $projectStore.data?.languages[j].iso_code
						)[0].is_reviewed,
						text:
							$projectStore.data?.translations.find(
								(t: translation) =>
									t.key_name === $projectStore.data?.keys[i].name &&
									t.project_id === $projectStore.data?.project.id &&
									t.iso_code === $projectStore.data?.languages[j].iso_code
							)?.text ?? ''
					});
				} else {
					translations.push({
						key_name: $projectStore.data?.keys[i].name ?? '',
						project_id: $projectStore.data?.project.id ?? '',
						created_at: '',
						iso_code: $projectStore.data?.languages[j].iso_code ?? 'en',
						is_reviewed: false,
						text: ''
					});
				}
			}
			fullRows.push({
				id: i,
				key: $projectStore.data?.keys[i].name ?? '',
				description: $projectStore.data?.keys[i].description ?? '',
				translations: translations
			});
		}
		fullRows = fullRows; // Force update for reactive
	}

	onMount(async () => {
		await projectStore.getData({ projectId: $page.params.projectId });
		updateRows();
		databaseReady = true;
	});

	async function deleteKeys(rowIds: number[]) {
		let key;
		for (const rowId of rowIds) {
			key = fullRows.filter((element) => element.id === rowId)[0].key;
			const deleteReq = await database
				.from<definitions['key']>('key')
				.delete()
				.eq('name', key)
				.eq('project_id', $projectStore.data?.project.id);
			if (deleteReq.error) {
				alert(deleteReq.error.message);
			} else {
				delete fullRows[rowId];
			}
		}
		fullRows = fullRows;
		selectedRowIds = [];
	}

	async function handleCreateKey(event: { detail: string }) {
		await projectStore.getData({ projectId: $page.params.projectId });
		updateRows();
		console.log(event.detail);
		openBaseModal(event.detail);
	}

	async function handleUpdateRows() {
		await projectStore.getData({ projectId: $page.params.projectId });
		updateRows();
	}

	async function handleFinishBase(event: { detail: string }) {
		await projectStore.getData({ projectId: $page.params.projectId });
		updateRows();
		openTranslationModal(
			$projectStore.data!.translations.filter(
				(t: translation) =>
					t.key_name === event.detail && t.project_id === $projectStore.data?.project.id
			),
			event.detail
		);
	}

	let createBaseTranslationModal: { open: boolean; key: string } = { open: false, key: '' };

	function openBaseModal(key: string) {
		createBaseTranslationModal.key = key;
		createBaseTranslationModal.open = true;
	}

	function checkIfBase(row: any) {
		return (
			row.translations.find(
				(t: translation) => t.iso_code === $projectStore.data?.project.default_iso_code
			)?.text === ''
		);
	}

	function openCreateKeyModal() {
		createKeyModal.open = true;
	}
</script>

<div class="p-8">
	<h1>Keys</h1>
	<p>All your translation keys will appear here. You can create, delete and edit them.</p>
</div>

<div style="padding-left: 2rem;padding-right:2rem">
	{#if databaseReady}
		<DataTable batchSelection bind:selectedRowIds {headers} {rows}>
			<Toolbar>
				<ToolbarBatchActions>
					<Button icon={Delete16} on:click={() => deleteKeys(selectedRowIds)}>Delete keys</Button>
				</ToolbarBatchActions>
				<ToolbarContent>
					<ToolbarSearch placeholder="Search your translations" bind:value={search} />
					<Button on:click={() => openCreateKeyModal()}>Create key</Button>
				</ToolbarContent>
			</Toolbar>
			<span slot="cell" let:row let:cell>
				{#if cell.key === 'overflow'}
					{#if checkIfBase(row) === false}
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
					{/if}
				{:else}{cell.value}{/if}
			</span>
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
<CreateKeyModal bind:open={createKeyModal.open} on:createKey={handleCreateKey} />
<CreateBaseTranslationModal
	bind:open={createBaseTranslationModal.open}
	key={createBaseTranslationModal.key}
	on:finishBase={handleFinishBase}
/>
