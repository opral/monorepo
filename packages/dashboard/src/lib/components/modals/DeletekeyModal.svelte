<script lang="ts">
	import { Modal } from 'carbon-components-svelte';
	import { database } from '$lib/services/database';
	import type { definitions } from '@inlang/database';
	import { projectStore } from '$lib/stores/projectStore';
	import { page } from '$app/stores';

	export function show(args: { key: definitions['key'] }): void {
		key = args.key;
		open = true;
	}

	export function hide(): void {
		open = false;
	}

	let key: definitions['key'] = '';
	let open = false;

	async function deleteKey() {
		const deleteReequest = await database
			.from<definitions['key']>('key')
			.delete()
			.eq('name', key.name)
			.eq('project_id', key.project_id);
		if (deleteReequest.error) {
			alert(deleteReequest.error.message);
		}
		projectStore.getData({ projectId: $page.params.projectId });
		open = false;
	}
</script>

<Modal
	bind:open
	danger
	modalHeading={`Delete ${key.name}`}
	primaryButtonText="Delete"
	secondaryButtonText="Cancel"
	on:click:button--primary={deleteKey}
	on:click:button--secondary={() => (open = false)}
>
	<p>Are you sure? This is a permanent action and cannot be undone.</p>
</Modal>
