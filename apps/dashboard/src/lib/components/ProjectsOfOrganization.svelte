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
	//import AddMemberModal from '$lib/components/modals/AddMemberModal.svelte';
	import Delete16 from 'carbon-icons-svelte/lib/Delete16';
	import { onMount } from 'svelte';
	import type { definitions } from '@inlang/database';
	import { DatabaseResponse } from '$lib/types/databaseResponse';
	import { database } from '$lib/services/database';
	import Add16 from 'carbon-icons-svelte/lib/Add16';
	import ConfirmModal, { defaultConfirmModalText } from './modals/ConfirmModal.svelte';
	import { Result } from '@inlang/common';

	export let organization: definitions['organization'];

	let createProjectModal: CreateProjectModal;

	let confirmModal: ConfirmModal;

	let isLoading = true;

	let projects: DatabaseResponse<definitions['project'][]>;

	// load the projects of the selected organization
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

	const headers = [
		{ key: 'name', value: 'Project name' },
		{ key: 'actions', empty: true }
	];

	$: rows_projects = () => {
		if (isLoading || projects.error || projects.data === null) {
			return [];
		}
		return projects.data
			.filter((project) => project.organization_id === organization.id)
			.map((project) => ({
				id: project.id,
				name: project.name,
				object: project
			}));
	};

	async function deleteProject(id: definitions['project']['id']): Promise<Result<void, Error>> {
		const deletion = await database.from<definitions['project']>('project').delete().match({ id });
		if (deletion.error) {
			return Result.err(Error(deletion.error.message));
		}
		await loadProjects();
		return Result.ok(undefined);
	}
</script>

{#if isLoading}
	<Loading />
{/if}

<!-- padding 0 top is neccessary  -->
<DataTable {headers} rows={rows_projects()} class="pt-0">
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
						onProjectCreated: loadProjects,
						organizationId: organization.id
					})}>New project</Button
			>
		</ToolbarContent>
	</Toolbar>
	<span slot="cell" let:row let:cell>
		{#if cell.key === 'name'}
			<Link href={`/project/${row.id}/keys`}>
				<div class="flex items-center space-x-2">
					<!-- <Tag type="blue">{cell.value.substring(0, 2)}</Tag> -->
					<p class="text-sm">{cell.value}</p>
				</div>
			</Link>
		{:else if cell.key === 'actions'}
			<row class="justify-end items-center">
				<Button
					kind="ghost"
					icon={Delete16}
					tooltipAlignment="start"
					tooltipPosition="left"
					iconDescription="Delete project"
					on:click={() => {
						confirmModal.show({
							heading: defaultConfirmModalText.delete.project.heading,
							message: defaultConfirmModalText.delete.project.message,
							danger: true,
							requireTypingOf: row.object.name,
							onConfirm: () => {
								return deleteProject(row.object.id);
							}
						});
					}}
				/>
			</row>
		{:else}
			{cell.value}
		{/if}
	</span>
</DataTable>

<CreateProjectModal bind:this={createProjectModal} />

<ConfirmModal bind:this={confirmModal} />

<!-- Do we need a more button? -->
<!-- {#if showMoreModal && name == 'organization'}{:else if showMoreModal && name == 'project'}{/if} -->
