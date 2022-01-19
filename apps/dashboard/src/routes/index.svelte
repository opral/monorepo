<script lang="ts">
	import {
		Button,
		DataTable,
		Toolbar,
		ToolbarContent,
		ToolbarBatchActions,
		Loading,
		Link
	} from 'carbon-components-svelte';
	import CreateProjectModal from '$lib/components/modals/CreateProjectModal.svelte';
	import Delete16 from 'carbon-icons-svelte/lib/Delete16';
	import { onMount } from 'svelte';
	import type { definitions } from '@inlang/database';
	import { DatabaseResponse } from '$lib/types/databaseResponse';
	import { database } from '$lib/services/database';
	import Add16 from 'carbon-icons-svelte/lib/Add16';

	let createProjectModal: CreateProjectModal;

	let isLoading = true;

	let projects: DatabaseResponse<definitions['project'][]>;

	onMount(async () => {
		await loadProjects();
	});

	async function loadProjects(): Promise<void> {
		isLoading = true;
		projects = await database.from<definitions['project']>('project').select().order('name');
		if (projects.error) {
			alert(projects.error);
		}
		isLoading = false;
	}

	const headers = [{ key: 'name', value: 'Project name' }];

	let rows: () => { id: string; name: string; object: definitions['project'] }[];
	$: rows = () => {
		if (isLoading || projects.error || projects.data === null) {
			return [];
		}
		return projects.data.map((project) => ({
			id: project.id,
			name: project.name,
			object: project
		}));
	};
</script>

{#if isLoading}
	<Loading />
{/if}

<!-- padding 0 top is neccessary  -->
<DataTable {headers} rows={rows()} class="pt-0">
	<Toolbar>
		<ToolbarBatchActions class="bg-danger">
			<Button icon={Delete16} kind="danger">Delete</Button>
		</ToolbarBatchActions>
		<ToolbarContent>
			<!-- <ToolbarSearch placeholder="Search project" /> -->
			<Button
				icon={Add16}
				on:click={() =>
					createProjectModal.show({
						onProjectCreated: loadProjects
					})}>New project</Button
			>
		</ToolbarContent>
	</Toolbar>
	<span slot="cell" let:row let:cell>
		{#if cell.key === 'name'}
			<Link href={`/project/${row.id}/messages`}>
				<div class="flex items-center space-x-2">
					<!-- <Tag type="blue">{cell.value.substring(0, 2)}</Tag> -->
					<p class="text-sm">{cell.value}</p>
				</div>
			</Link>
		{:else}
			{cell.value}
		{/if}
	</span>
</DataTable>

<CreateProjectModal bind:this={createProjectModal} />
