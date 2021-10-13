<script lang="ts">
	import {
		Button,
		DataTable,
		Tag,
		Toolbar,
		ToolbarContent,
		ToolbarBatchActions,
		ToolbarSearch,
		Pagination,
		Loading
	} from 'carbon-components-svelte';
	import OrganizationModal from '$lib/components/modals/OrganizationModal.svelte';

	import Delete16 from 'carbon-icons-svelte/lib/Delete16';
	import OverflowMenuHorizontal32 from 'carbon-icons-svelte/lib/OverflowMenuHorizontal32';
	import { onMount } from 'svelte';
	import type { definitions } from '@inlang/database/types/definitions';
	import { DatabaseResponse } from '$lib/types/databaseResponse';
	import { database } from '$lib/services/database';
	import { goto } from '$app/navigation';

	let showAddOrganizationModal = false;
	// let showMoreModal = false;

	// as entered in the search bar
	$: searchQuery = '';

	let isLoading = true;

	let organizations: DatabaseResponse<definitions['organization'][]>;

	onMount(async () => {
		organizations = await database.from<definitions['organization']>('organization').select('*');
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

	const headers = [
		{ key: 'name', value: 'Name' },
		{ key: 'more', empty: true }
		//{ key: 'admin', value: 'Admin email' },
		//{ key: 'num_projects', value: 'Number of projects' },
		//{ key: 'members', value: 'Members in ' }
	];

	// rows needs to be reactive. Otherwise, the rows do not update
	// when projectStore.data changes or the search query
	$: rows = () => {
		if (isLoading || organizations.error || organizations.data === null) {
			return [];
		}
		// TODO: sort the organizations alphabetically
		return organizations.data.map((organization) => ({
			id: organization.id,
			name: organization.name
			//admin: organization.admin.email,
			//num_projects: organization.projects.length,
			//members: organization.members.length
		}));
	};
</script>

<div class="pl-8 pr-8 pt-8">
	<h1>Your Organizations</h1>
	<p>Organizations help you to easily share and manage projects within your company.</p>
</div>

{#if isLoading}
	<Loading />
{/if}

<div class="p-8">
	<DataTable {headers} rows={rows()}>
		<Toolbar>
			<ToolbarBatchActions class="bg-danger">
				<Button icon={Delete16} kind="danger">Delete</Button>
			</ToolbarBatchActions>
			<ToolbarContent>
				<ToolbarSearch placeholder="Search organization" />
				<Button on:click={() => (showAddOrganizationModal = true)}>Add organization</Button>
			</ToolbarContent>
		</Toolbar>
		<!-- TODO: go to projects of a specific organizationn when clicking on a row -->
		<span slot="cell" let:row let:cell on:click={() => goto(`/project/?organization=${row.id}`)}>
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
						// showMoreModal = true;
					}}
				/>
			{:else}
				{cell.value}
			{/if}
		</span>
	</DataTable>
</div>
<!-- TODO: make pagination interactible -->
<div class="pl-8 pr-8">
	<Pagination totalItems={102} page={4} />
</div>

{#if showAddOrganizationModal}
	<OrganizationModal
		bind:open={showAddOrganizationModal}
		heading="Add project"
		organizationName=""
		on:updateOrganizations={handleOrganizationUpdate}
	/>
{/if}

<!-- Do we need a more button? -->
<!-- {#if showMoreModal}{/if} -->
