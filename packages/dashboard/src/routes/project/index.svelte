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
		ToolbarMenuItem,
		Pagination,
		Loading
	} from 'carbon-components-svelte';
	import ProjectModal from '$lib/components/modals/ProjectModal.svelte';
	import OrganizationModal from '$lib/components/modals/OrganizationModal.svelte';
	import Delete16 from 'carbon-icons-svelte/lib/Delete16';
	import OverflowMenuHorizontal32 from 'carbon-icons-svelte/lib/OverflowMenuHorizontal32';
	import { onMount, afterUpdate } from 'svelte';
	import type { definitions } from '@inlang/database';
	import { DatabaseResponse } from '$lib/types/databaseResponse';
	import { database } from '$lib/services/database';
	import { goto } from '$app/navigation';

	import { InlineNotification, Content } from 'carbon-components-svelte';
	import ProjectSidenav from '$lib/layout/ProjectSidenav.svelte';

	//export let name = '';

	let showAddOrganizationModal = false;
	let showAddProjectModal = false;
	let showMoreModal = false;
	let showAddMemberModal = false;

	// as entered in the search bar
	$: searchQuery = '';

	let isLoading = true;
	let selectedOrgId: string | null = null;
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

	async function handleOrganizationUpdate() {
		organizations = await database.from<definitions['organization']>('organization').select();

		if (organizations.error) {
			alert(organizations.error);
		}
		isLoading = false;
	}

	async function handleProjectUpdate() {
		projects = await database.from<definitions['project']>('project').select();

		if (projects.error) {
			alert(projects.error);
		}
		isLoading = false;
	}

	const headers = [
		{ key: 'name', value: 'Name' },
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
				name: project.name
			}));
	};

	$: rows_organizations = () => {
		if (isLoading || organizations.error || organizations.data === null) {
			return [];
		}
		// TODO: sort the organizations alphabetically
		return organizations.data.map((organization) => ({
			id: organization.id,
			name: organization.name
		}));
	};
</script>

{#if isLoading}
	<Loading />
{/if}

<grid class="grid-cols-2">
	<div class="p-2">
		<div class="pt-8 pb-8">
			<h1>Your Organizations</h1>
		</div>
		<DataTable {headers} rows={rows_organizations()}>
			<Toolbar>
				<ToolbarBatchActions class="bg-danger">
					<Button icon={Delete16} kind="danger">Delete</Button>
				</ToolbarBatchActions>
				<ToolbarContent>
					<ToolbarSearch placeholder="Search organization" />
					<Button on:click={() => (showAddOrganizationModal = true)}>Add organization</Button>
				</ToolbarContent>
			</Toolbar>
			<span slot="cell" let:row let:cell on:click={() => (selectedOrgId = row.id)}>
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
							// selectedShowMoreModal = row.id;
							showMoreModal = true;
						}}
					/>
				{:else}
					{cell.value}
				{/if}
			</span>
		</DataTable>
	</div>

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
			<span slot="cell" let:row let:cell on:click={() => goto(`/project/${row.id}`)}>
				{#if cell.key === 'name'}
					<div class="flex items-center space-x-2">
						<Tag type="blue">{cell.value.substring(0, 2)}</Tag>
						<p class="text-sm">{cell.value}</p>
					</div>
				{:else if cell.key === 'more'}
					<!-- TODO: add more button should be an add member button -->
					<Button
						kind="ghost"
						icon={OverflowMenuHorizontal32}
						iconDescription="More"
						on:click={() => {
							// addMemberModal = row.id;
							showMoreModal = true;
						}}
					/>
				{:else}
					{cell.value}
				{/if}
			</span>
		</DataTable>
	</div>
</grid>

{#if showAddProjectModal}
	<ProjectModal
		bind:open={showAddProjectModal}
		heading="Add project"
		projectName=""
		on:updateProjects={handleProjectUpdate}
	/>
{/if}

{#if showAddOrganizationModal}
	<OrganizationModal
		bind:open={showAddOrganizationModal}
		heading="Add organization"
		organizationName=""
		on:updateOrganizations={handleOrganizationUpdate}
	/>
{/if}

<!-- Do we need a more button? -->
<!-- {#if showMoreModal && name == 'organization'}{:else if showMoreModal && name == 'project'}{/if} -->
