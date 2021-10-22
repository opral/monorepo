<script lang="ts">
	import { Modal } from 'carbon-components-svelte';
	import { database } from '$lib/services/database';
	import type { definitions } from '@inlang/database';
	import { projectStore } from '$lib/stores/projectStore';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	export function show(args: { project: definitions['project'] }): void {
		project = args.project;
		open = true;
	}

	export function hide(): void {
		open = false;
	}

	let project: definitions['project'];
	let open = false;

	async function deleteProject() {
		const deleteRequest = await database
			.from<definitions['project']>('project')
			.delete()
			.eq('id', project.id);
		if (deleteRequest.error) {
			alert(deleteRequest.error.message);
		}
		projectStore.getData({ projectId: $page.params.projectId });
		open = false;
		goto('/');
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
