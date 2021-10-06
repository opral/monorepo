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
	import Delete16 from 'carbon-icons-svelte/lib/Delete16';
	import OverflowMenuHorizontal32 from 'carbon-icons-svelte/lib/OverflowMenuHorizontal32';
	import { onMount } from 'svelte';
	import type { definitions } from '@inlang/database/types/definitions';
	import { DatabaseResponse } from '$lib/types/databaseResponse';
	import { database } from '$lib/services/database';

	export let name = '';

	let showAddEntityModal = false;
	let showMoreModal = false;

	// as entered in the search bar
	$: searchQuery = '';

	let isLoading = true;

	let projects: DatabaseResponse<definitions['project'][]>;

	onMount(async () => {
		projects = await database.from<definitions['project']>('project').select('*');
		if (projects.error) {
			alert(projects.error);
		}
		isLoading = false;
	});

	const headers = [
		{ key: 'name', value: 'Name' },
		{ key: 'more', empty: true }
	];

	// rows needs to be reactive. Otherwise, the rows do not update
	// when projectStore.data changes or the search query
	$: rows = () => {
		if (isLoading || projects.error || projects.data === null) {
			return [];
		}
		// TODO: sort the projects alphabetically
		return projects.data.map((project) => ({
			id: project.id,
			name: project.name
		}));
	};
</script>

<div class="pl-8 pr-8 pt-8">
	<h1>Projects</h1>
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
				<ToolbarSearch placeholder="Search project" />
				<Button on:click={() => (showAddEntityModal = true)}>Add project</Button>
			</ToolbarContent>
		</Toolbar>
		<span slot="cell" let:row let:cell>
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
<!-- TODO: make pagination interactible -->
<div class="pl-8 pr-8">
	<Pagination totalItems={102} page={4} />
</div>

<!-- TODO -->

{#if showAddEntityModal}
	<ProjectModal open={true} primaryButtonDisabled={true} heading="Add project" projectName="" />
{/if}

<!-- Do we need a more button? -->
{#if showMoreModal && name == 'organization'}{:else if showMoreModal && name == 'project'}{/if}
