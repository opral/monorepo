<script lang="ts">
	import {
		Button,
		DataTable,
		PaginationNav,
		Toolbar,
		ToolbarBatchActions,
		ToolbarContent,
		ToolbarSearch,
		Tag
	} from 'carbon-components-svelte';
	import Delete16 from 'carbon-icons-svelte/lib/Delete16';
	import TrashCan32 from 'carbon-icons-svelte/lib/TrashCan32';
	import TranslationModal from '$lib/components/modals/TranslationModal.svelte';
	import { onMount } from 'svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import CreateKeyModal from '$lib/components/modals/CreateKeyModal.svelte';
	import CreateBaseTranslationModal from '$lib/components/modals/CreateBaseTranslationModal.svelte';
	import { database } from '$lib/services/database';
	import type { definitions } from '@inlang/database';
	import { page } from '$app/stores';
	import Translations from '$lib/components/Translations.svelte';
	import DeletekeyModal from '$lib/components/modals/DeletekeyModal.svelte';
	import { cloneDeep } from 'lodash';
	//import { DataTableRow } from 'carbon-components-svelte/types/DataTable/DataTable';

	const headers = [
		{ key: 'key', value: 'Key' },
		// { key: 'description', value: 'Description' },
		{ key: 'actions', empty: true }
		// { key: 'status', value: 'Status' }
	];

	type Row = {
		id: number;
		key: string;
		description: string;
		translations: definitions['translation'][];
	};

	let selectedRowIds: number[];
	let openDeleteModal = false;

	let search = '';
	let fullRows: Row[] = [];

	let selectedRow: Row;

	$: rows = fullRows.filter((row) => row.key.indexOf(search) !== -1);

	// check if for this key there is a translation for each of the languages in the project
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function isKeyMissingTranslation(row: any): boolean {
		// console.log(row.key);
		// console.log($projectStore.data?.languages.length);
		// console.log(
		// 	$projectStore.data?.translations.map(
		// 		(t) => t.key_name === row.key && t.project_id === $page.params.projectId
		// 	)
		// );
		// console.log(
		// 	$projectStore.data?.translations.map(
		// 		(t) => t.key_name === row.key && t.project_id === $page.params.projectId
		// 	).length
		// );
		const x = $projectStore.data?.languages.length;
		const y = $projectStore.data?.translations.map((t) => t.key_name === row.key).length;
		//console.log(x);
		//console.log($projectStore.data?.languages.length, row.translations.length);
		//console.log();
		let lhs = $projectStore.data?.languages.length;
		let rhs = row.translations.filter((translation: any) => {
			return translation.text !== '';
		}).length;
		console.log(lhs, rhs);
		return lhs !== rhs;
	}

	//check if this key has a translation that is still not reviewed
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function isKeyFullyReviewed(currentKey: any): boolean {
		// get all the translations of the key
		const allTranslationsOfKey =
			$projectStore.data?.translations.filter(
				(translation) => translation.key_name === currentKey.key
			) ?? [];
		const missingReviews = allTranslationsOfKey.filter(
			(translation) => translation.is_reviewed === false
		);
		return missingReviews.length === 0;
	}

	let createTranslationModal: {
		open: boolean;
		translations: definitions['translation'][];
		key: string;
	} = {
		open: false,
		translations: [],
		key: ''
	};
	let createKeyModal: { open: boolean } = { open: false };

	function openTranslationModal(translations: definitions['translation'][], key: string) {
		const translationsCopy = cloneDeep(translations);
		createTranslationModal.translations = translationsCopy;
		createTranslationModal.key = key;
		createTranslationModal.open = true;
	}

	let databaseReady = false;

	function updateRows() {
		fullRows = [];
		for (let i = 0; i < ($projectStore.data?.keys.length ?? 0); i++) {
			let translations: definitions['translation'][] = [];
			for (let j = 0; j < ($projectStore.data?.languages.length ?? 0); j++) {
				if (
					$projectStore.data?.translations.some(
						(t) =>
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
							(t) =>
								t.key_name === $projectStore.data?.keys[i].name &&
								t.project_id === $projectStore.data?.project.id &&
								t.iso_code === $projectStore.data?.languages[j].iso_code
						)[0].is_reviewed,
						text:
							$projectStore.data?.translations.find(
								(t) =>
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
		if ($projectStore.data === null) {
			alert('translations are null');
			return;
		}
		openTranslationModal(
			$projectStore.data.translations.filter(
				(t) => t.key_name === event.detail && t.project_id === $projectStore.data?.project.id
			),
			event.detail
		);
	}

	let createBaseTranslationModal: { open: boolean; key: string } = { open: false, key: '' };

	function openBaseModal(key: string) {
		createBaseTranslationModal.key = key;
		createBaseTranslationModal.open = true;
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
		<DataTable expandable bind:selectedRowIds {headers} {rows}>
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
				{#if cell.key === 'actions'}
					<row class="justify-end items-center">
						<!-- Status  -->
						<div>
							{#if isKeyMissingTranslation(row) === true}
								<Tag type="red">Missing translation</Tag>
							{:else if isKeyFullyReviewed(row) === false}
								<Tag type="purple">Needs approval</Tag>
							{:else}
								<Tag type="green">Complete</Tag>
							{/if}
						</div>
						<!-- Delete Action -->
						<Button
							on:click={() => ((openDeleteModal = true), (selectedRow = row.value))}
							iconDescription="Delete translation"
							icon={TrashCan32}
							kind="danger-ghost"
						/>
					</row>
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
<CreateKeyModal bind:open={createKeyModal.open} on:createKey={handleCreateKey} />
<CreateBaseTranslationModal
	bind:open={createBaseTranslationModal.open}
	keyName={createBaseTranslationModal.key}
	on:finishBase={handleFinishBase}
/>

{#if openDeleteModal === true}
	<DeletekeyModal bind:open={openDeleteModal} {selectedRow} on:updateKeys={handleUpdateRows} />
{/if}
