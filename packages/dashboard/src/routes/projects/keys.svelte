<script>
	import { Button, Row } from 'carbon-components-svelte';
	import { Search } from 'carbon-components-svelte';
	import ArrowRight16 from 'carbon-icons-svelte/lib/ArrowRIght16';
	import ArrowLeft16 from 'carbon-icons-svelte/lib/ArrowLeft16';
	import Number_1 from 'carbon-icons-svelte/lib/Number_132';
	import Settings16 from 'carbon-icons-svelte/lib/Settings16';
	import Edit32 from 'carbon-icons-svelte/lib/Edit32';
	import Delete16 from 'carbon-icons-svelte/lib/Delete16';
	import { Pagination } from 'carbon-components-svelte';

	import { Tag } from 'carbon-components-svelte';

	import { PaginationNav } from 'carbon-components-svelte';
	import { DataTable } from 'carbon-components-svelte';

	import {
		Toolbar,
		ToolbarMenu,
		ToolbarContent,
		ToolbarBatchActions,
		ToolbarSearch,
		ToolbarMenuItem
	} from 'carbon-components-svelte';

	const headers = [
		{ key: 'name', value: 'Name' },
		{ key: 'description', value: 'Description' },
		{ key: 'translation', value: 'Translation' },
		{ key: 'overflow', empty: true }
	];
	const rows = [
		{ id: 1, name: 'hello_world', description: '', translation: 'hej_verden' },
		{ id: 2, name: 'log_in', description: '', translation: 'log_på' }
	];

	function createKey() {}
	function showMore() {}
	function deleteKeys() {}
	function showAddLanguageModal() {}
	function localeProgress() {
		return Math.random() * 100;
	}
</script>

<div style="padding-left: 2rem;padding-right:2rem; padding-top:2rem">
	<p>Organizations / labfrogs / bromb / Keys</p>
</div>

<div style="padding: 2rem;">
	<h1>Keys</h1>
	<p>All your translation keys will appear here. You can create, delete and edit them.</p>
</div>

<div style="padding-left: 2rem;padding-right:2rem">
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
		<span slot="cell" let:cell>
			{#if cell.key === 'overflow'}
				<Button iconDescription="Modify translation" icon={Edit32} kind="ghost" />
			{:else}{cell.value}{/if}
		</span>
	</DataTable>
	<Pagination totalItems={102} page={4} />
</div>

<!-- <div class="mt-2 flex flex-row justify-center">
	<PaginationNav total={1} class="bottom" />
</div> -->
