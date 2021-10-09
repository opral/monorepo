<script lang="ts">
	import { Modal, TextArea } from 'carbon-components-svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import { database } from '$lib/services/database';
	import { page } from '$app/stores';
	import { createEventDispatcher } from 'svelte';
	import type { definitions } from '@inlang/database';

	export let open = false;
	let key, description;
	const dispatch = createEventDispatcher();

	async function save() {
		const insert = await database
			.from<definitions['key']>('key')
			.insert({ project_id: $page.path.split('/')[2], name: key, description: description });
		if (insert.error) {
			alert(insert.error.message);
		} else {
			projectStore.getData({ projectId: $page.params.projectId });
			/*let newRow = {
				id: largestTableId + 1,
				database_id: insert.data[0].id,
				key: key,
				description: description,
				translations: []
			};*/
			dispatch('createKey', key);
		}
	}
</script>

<Modal
	bind:open
	modalHeading="Create key"
	size="sm"
	primaryButtonText="Create"
	secondaryButtonText="Cancel"
	on:click:button--secondary={() => {
		open = false;
	}}
	on:submit={() => {
		open = false;
		save();
	}}
	preventCloseOnClickOutside
	hasScrollingContent
	shouldSubmitOnEnter={false}
>
	<div>
		<div class="flex items-center">
			<TextArea labelText="Key:" bind:value={key} />
		</div>
		<div class="flex items-center">
			<TextArea labelText="Description:" bind:value={description} />
		</div>
	</div>
</Modal>
