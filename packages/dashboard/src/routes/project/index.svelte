<script lang="ts">
	import {
		Button,
		DataTable,
		Tag,
		Toolbar,
		ToolbarContent,
		ToolbarBatchActions,
		ToolbarSearch,
		Loading
	} from 'carbon-components-svelte';
	import ProjectModal from '$lib/components/modals/ProjectModal.svelte';
	import OrganizationModal from '$lib/components/modals/OrganizationModal.svelte';
	//import AddMemberModal from '$lib/components/modals/AddMemberModal.svelte';
	import Delete16 from 'carbon-icons-svelte/lib/Delete16';
	import OverflowMenuHorizontal32 from 'carbon-icons-svelte/lib/OverflowMenuHorizontal32';
	import { onMount } from 'svelte';
	import type { definitions } from '@inlang/database';
	import { DatabaseResponse } from '$lib/types/databaseResponse';
	import { database } from '$lib/services/database';
	import { goto } from '$app/navigation';

	import { InlineNotification, Content } from 'carbon-components-svelte';
	import ProjectSidenav from '$lib/layout/ProjectSidenav.svelte';
	import { page } from '$app/stores';

	//export let name = '';

	let showAddOrganizationModal = false;
	let showAddProjectModal = false;
	// let showMoreModal = false;
	// as entered in the search bar
	$: searchQuery = '';

	let isLoading = true;
	let selectedOrgId: string | null = $page.query.get('organization');
	let selectedProjId: string | null = null;

	let projects: DatabaseResponse<definitions['project'][]>;
	let organizations: DatabaseResponse<definitions['organization'][]>;

	// load the projects of the selected organization
	onMount(async () => {
		organizations = await database.from<definitions['organization']>('organization').select();
		projects = await database.from<definitions['project']>('project').select();

		if (projects.error) {
			alert(projects.error);
		}
		if (organizations.error) {
			alert(organizations.error);
		}
		isLoading = false;
	});

	async function handleProjectUpdate() {
		projects = await database.from<definitions['project']>('project').select();

		if (projects.error) {
			alert(projects.error);
		}
		isLoading = false;
	}

	const headers = [
		{ key: 'name', value: 'Name' },
		{ key: 'organization', value: 'Organization' },
		{ key: 'more', empty: true }
	];

	$: rows_projects = () => {
		if (isLoading || projects.error || projects.data === null) {
			return [];
		}
		// TODO: sort the projects alphabetically
		return projects.data
			.filter((project) => {
				if (selectedOrgId) {
					return project.organization_id === selectedOrgId;
				}
				return true;
			})
			.map((project) => ({
				id: project.id,
				name: project.name,
				organization: organizations.data?.filter((org) => org.id === project.organization_id)[0]
					.name
			}));
	};

	console.log($page.query.get('organization'));
</script>

{#if isLoading}
	<Loading />
{/if}

<div class="p-2">
	<div class="pt-8 pb-8">
		<h1>Projects</h1>
	</div>
	<DataTable {headers} rows={rows_projects()}>
		<Toolbar>
			<ToolbarBatchActions class="bg-danger">
				<Button icon={Delete16} kind="danger">Delete</Button>
			</ToolbarBatchActions>
			<ToolbarContent>
				<ToolbarSearch placeholder="Search project" />
				<Button on:click={() => (showAddProjectModal = true)}>Add project</Button>
			</ToolbarContent>
		</Toolbar>
		<span
			slot="cell"
			let:row
			let:cell
			on:click={() => goto(`/project/${row.id}`)}
			class="cursor-pointer"
		>
			{#if cell.key === 'name'}
				<div class="flex items-center space-x-2">
					<Tag type="blue">{cell.value.substring(0, 2)}</Tag>
					<p class="text-sm">{cell.value}</p>
				</div>
			{:else if cell.key === 'more'}
				<Button
					kind="ghost"
					icon={OverflowMenuHorizontal32}
					iconDescription="More"
					on:click={() => {
						// addMemberModal = row.id;
						// showMoreModal = true;
					}}
				/>
			{:else if cell.key === 'organization'}
				{cell.value}
			{:else}
				{cell.value}
			{/if}
		</span>
	</DataTable>
</div>

{#if showAddProjectModal}
	<ProjectModal
		bind:open={showAddProjectModal}
		heading="Add project"
		projectName=""
		on:updateProjects={handleProjectUpdate}
	/>
{/if}

<!-- Do we need a more button? -->
<!-- {#if showMoreModal && name == 'organization'}{:else if showMoreModal && name == 'project'}{/if} -->
