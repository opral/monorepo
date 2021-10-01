<script lang="ts">
	import {
		Breadcrumb,
		BreadcrumbItem,
		Button,
		DataTable,
		Pagination,
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

	const headers = [
		{ key: 'key', value: 'Key' },
		{ key: 'description', value: 'Description' },
		{ key: 'overflow', empty: true },
	];
	let rows = [
	];

	let createTranslationModal = { open: false, translations: [], key: ""};

	function openModal(original: string, translations: [], key: string) {
		const translationsImmutable = List(translations);
		createTranslationModal.translations = translationsImmutable.toJS();
		createTranslationModal.key = key;
		createTranslationModal.open = true;
	}

	let databaseReady = false;

	onMount(async () => {
		for(let i = 0; i < $projectStore.data.keys.length; i++) {
			rows.push({'id': i,
				'key': $projectStore.data.keys[i].name,
				'description': $projectStore.data.keys[i].description,
				'translations': $projectStore.data.translations.filter((translation) => translation.key_id === $projectStore.data.keys[i].id),
				'original_iso': $projectStore.data.translations.filter((translation) => translation.key_id === $projectStore.data.keys[i].id
						&& translation.language_iso === $projectStore.data.project.default_language_iso)})
		}
		console.log($projectStore.data);
		console.log(rows);

		databaseReady = true;
	})
</script>

<div class="pl-8 pr-8 pt-8">
	<Breadcrumb>
		<BreadcrumbItem href="/">Organizations</BreadcrumbItem>
		<BreadcrumbItem href="/reports">labfrogs</BreadcrumbItem>
		<BreadcrumbItem href="/reports/2019" isCurrentPage>bromb</BreadcrumbItem>
		<BreadcrumbItem href="/reports/2019/" isCurrentPage>Keys</BreadcrumbItem>
	</Breadcrumb>
</div>

<div class="p-8">
	<h1>Keys</h1>
	<p>All your translation keys will appear here. You can create, delete and edit them.</p>
</div>

<TranslationModal bind:open={createTranslationModal.open} translations={createTranslationModal.translations} key={createTranslationModal.key}/>

<div style="padding-left: 2rem;padding-right:2rem">
	{#if databaseReady}
	<DataTable batchSelection {headers} {rows}>
		<Toolbar>
			<ToolbarBatchActions>
				<Button icon={Delete16}>Delete keys</Button>
			</ToolbarBatchActions>
			<ToolbarContent>
				<ToolbarSearch placeholder="Search your translations" />
				<Button>Create key</Button>
			</ToolbarContent>
		</Toolbar>
		<span slot="cell" let:row let:cell>
			{#if cell.key === 'overflow'}
				<Button on:click={() => openModal(row.original_iso[0].text, row.translations, row.key)} iconDescription="Modify translation" icon={Edit32} kind="ghost" />
			{:else}{cell.value}{/if}
		</span>
	</DataTable>
	<Pagination totalItems={102} page={4} />
	{/if}
</div>
<!-- <div class="mt-2 flex flex-row justify-center">
	<PaginationNav total={1} class="bottom" />
</div> -->