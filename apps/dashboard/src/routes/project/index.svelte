<script lang="ts">
	import {
		Button,
		DataTable,
		Toolbar,
		ToolbarContent,
		ToolbarBatchActions,
		Loading
	} from 'carbon-components-svelte';
	import CreateProjectModal from '$lib/components/modals/CreateProjectModal.svelte';
	//import AddMemberModal from '$lib/components/modals/AddMemberModal.svelte';
	import Delete16 from 'carbon-icons-svelte/lib/Delete16';
	import { onMount } from 'svelte';
	import type { definitions } from '@inlang/database';
	import { DatabaseResponse } from '$lib/types/databaseResponse';
	import { database } from '$lib/services/database';
	import { goto } from '$app/navigation';

	let createProjectModal: CreateProjectModal;

	let isLoading = true;

	let projects: DatabaseResponse<definitions['project'][]>;

	// load the projects of the selected organization
	onMount(async () => {
		await loadProjects();
		isLoading = false;
	});

	async function loadProjects(): Promise<void> {
		projects = await database.from<definitions['project']>('project').select().order('name');
		if (projects.error) {
			alert(projects.error);
		}
	}

	const headers = [
		{ key: 'name', value: 'Name' },
		{ key: 'organization', value: 'Organization' }
	];

	let rows: () => { id: string; name: string }[];
	$: rows = () => {
		if (isLoading || projects.error || projects.data === null) {
			return [];
		}
		return projects.data.map((project) => ({
			id: project.id,
			name: project.name
		}));
	};
</script>

{#if isLoading}
	<Loading />
{/if}

<h1>Projects</h1>
<br />
<DataTable {headers} rows={rows()}>
	<Toolbar>
		<ToolbarBatchActions class="bg-danger">
			<Button icon={Delete16} kind="danger">Delete</Button>
		</ToolbarBatchActions>
		<ToolbarContent>
			<!-- <ToolbarSearch placeholder="Search project" /> -->
			<Button on:click={() => createProjectModal.show({ onProjectCreated: loadProjects })}>
				Add project
			</Button>
		</ToolbarContent>
	</Toolbar>
	<span
		slot="cell"
		let:row
		let:cell
		on:click={() => goto(`/project/${row.id}/messages`)}
		class="cursor-pointer"
	>
		{#if cell.key === 'name'}
			<div class="flex items-center space-x-2">
				<!-- <Tag type="blue">{cell.value.substring(0, 2)}</Tag> -->
				<p class="text-sm">{cell.value}</p>
			</div>
		{:else if cell.key === 'organization'}
			{cell.value}
		{:else}
			{cell.value}
		{/if}
	</span>
</DataTable>

<CreateProjectModal bind:this={createProjectModal} />

<!-- Do we need a more button? -->
<!-- {#if showMoreModal && name == 'organization'}{:else if showMoreModal && name == 'project'}{/if} -->
