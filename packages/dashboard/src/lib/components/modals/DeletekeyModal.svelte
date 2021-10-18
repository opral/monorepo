<script lang="ts">
	import { Modal } from 'carbon-components-svelte';
	import { database } from '$lib/services/database';
	import type { definitions } from '@inlang/database';
	import { projectStore } from '$lib/stores/projectStore';
	import { createEventDispatcher } from 'svelte';

	let dispatch = createEventDispatcher();

	type row = {
		id: number;
		key: string;
		description: string;
		translations: definitions['translation'][];
	};

	export let selectedRow: row;
	export let open = false;

	async function deleteKey() {
		const deleteReq = await database
			.from<definitions['key']>('key')
			.delete()
			.eq('name', selectedRow.key)
			.eq('project_id', $projectStore.data?.project.id);
		if (deleteReq.error) {
			alert(deleteReq.error.message);
		}

		// automatically closing the modal but leave time to
		// let the user read the result status of the action
		setTimeout(() => {
			open = false;
			dispatch('updateKeys');
		}, 1000);
	}
</script>

<Modal
	bind:open
	danger
	modalHeading="Are you sure you want to delete the key?"
	primaryButtonText="Delete"
	secondaryButtonText="Cancel"
	on:click:button--primary={deleteKey}
	on:click:button--secondary={() => (open = false)}
	on:open
	on:close
	on:submit:
>
	<p>This is a permanent action and cannot be undone.</p>
</Modal>
