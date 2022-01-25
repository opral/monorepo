<script lang="ts">
	import { Modal } from 'carbon-components-svelte';
	import { database } from '$lib/services/database';
	import type { definitions } from '@inlang/database';

	export function show(args: { project: definitions['project']; onDeletion: () => unknown }): void {
		project = args.project;
		onDeletion = args.onDeletion;
		open = true;
	}

	export function hide(): void {
		open = false;
	}

	let project: definitions['project'];
	let onDeletion: () => unknown;
	let open = false;

	async function deleteProject(): Promise<void> {
		const deleteRequest = await database
			.from<definitions['project']>('project')
			.delete()
			.eq('id', project.id);
		if (deleteRequest.error) {
			alert(deleteRequest.error.message);
		} else {
			onDeletion();
		}
		open = false;
	}
</script>

<Modal
	bind:open
	danger
	modalHeading={`Delete ${project?.name}`}
	primaryButtonText="Delete"
	secondaryButtonText="Cancel"
	on:click:button--primary={deleteProject}
	on:click:button--secondary={() => (open = false)}
>
	<p>Are you sure? This is a permanent action and cannot be undone.</p>
</Modal>
