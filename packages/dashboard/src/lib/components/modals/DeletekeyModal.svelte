<script lang="ts">
	import { Modal } from 'carbon-components-svelte';
	import { database } from '$lib/services/database';
	import type { definitions } from '@inlang/database';

	export function show(args: { key: definitions['key'] }): void {
		key = args.key;
		open = true;
	}

	export function hide(): void {
		open = false;
	}

	let key: definitions['key'];
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
		open = false;
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
>
	<p>This is a permanent action and cannot be undone.</p>
</Modal>
