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
	import {List} from 'immutable'
	import TranslationModal from "$lib/components/modals/TranslationModal.svelte";
	import {onMount} from "svelte";
	import {projectStore} from "$lib/stores/projectStore";
	import CreateKeyModal from "$lib/components/modals/CreateKeyModal.svelte";
	import {database} from "$lib/services/database";

	const headers = [
		{ key: 'key', value: 'Key' },
		{ key: 'description', value: 'Description' },
		{ key: 'overflow', empty: true },
	];
	let fullRows = [];
	let selectedRowIds;

	let search = "";

	$: rows = fullRows.filter(row => row.key.indexOf(search) !== -1);

	let createTranslationModal = { open: false, translations: [], key: ""};
	let createKeyModal = { open: false, rows: fullRows, largestTableId: 0};

	function openModal(translations: [], key: string) {
		const translationsImmutable = List(translations);
		createTranslationModal.translations = translationsImmutable.toJS();
		createTranslationModal.key = key;
		createTranslationModal.open = true;
	}

	let databaseReady = false;

	onMount(async () => {
		for(let i = 0; i < $projectStore.data.keys.length; i++) {
			fullRows.push({'id': i,
				'key': $projectStore.data.keys[i].name,
				'description': $projectStore.data.keys[i].description,
				'translations': $projectStore.data.translations.filter((translation) => translation.key_id === $projectStore.data.keys[i].id)
			})
		}
		createKeyModal.largestTableId = $projectStore.data.keys.length;
		fullRows = fullRows; // Force update for reactive
		databaseReady = true;
	})

	async function deleteKeys(selectedRowIds) {
		let id;
		for (const rowId of selectedRowIds) {
			id = fullRows.find(element => element.id == rowId).id;
			console.log(id)
			const deleteReq = await database.from('key').delete().eq('id', id);
			if (deleteReq.error) {
				alert(deleteReq.error);
			} else {
				delete fullRows[rowId];
			}
		}
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
				<Button on:click={() => createKeyModal.open = true}>Create key</Button>
			</ToolbarContent>
		</Toolbar>
		<span slot="cell" let:row let:cell>
			{#if cell.key === 'overflow'}
				<Button on:click={() => openModal(row.translations, row.key)} iconDescription="Modify translation" icon={Edit32} kind="ghost" />
			{:else}{cell.value}{/if}
		</span>
	</DataTable>
	{/if}
</div>
<div class="mt-2 flex flex-row justify-center">
	<PaginationNav total={1} class="bottom" />
</div>

<TranslationModal bind:open={createTranslationModal.open} translations={createTranslationModal.translations} key={createTranslationModal.key}/>
<CreateKeyModal bind:open={createKeyModal.open} rows={createKeyModal.rows} largestTableId={createKeyModal.largestTableId}/>