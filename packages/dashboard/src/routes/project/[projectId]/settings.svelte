<script lang="ts">
	import type { definitions } from '@inlang/database';
	import { database } from '$lib/services/database';
	import { projectStore } from '$lib/stores/projectStore';
	import { CodeSnippet, TextInput, Button } from 'carbon-components-svelte';
	import DeleteProjectModal from '$lib/components/modals/DeleteProjectModal.svelte';

	let projectName = '';
	let deleteProjectModal: DeleteProjectModal;

	const renameProject = async () => {
		const response = await database
			.from<definitions['project']>('project')
			.update({ name: projectName })
			.eq('id', $projectStore?.data?.project.id ?? '');
		if (response.error) {
			alert(response.error);
		} else {
			alert('Project name has been changed to ' + projectName);
		}
	};

	const deleteProject = () => {
		deleteProjectModal.show({ project: $projectStore.data?.project });
	};
</script>

<div class="mr-64 space-y-4">
	<p>Project ID:</p>
	<CodeSnippet code={$projectStore.data?.project.id} />

	<p>Rename project:</p>
	<row class="items-center">
		<TextInput placeholder="Project Name" bind:value={projectName} />
		<Button kind="tertiary" on:click={() => renameProject()}>Rename</Button>
	</row>

	<row class="flex items-center space-x-4">
		<p>Delete project:</p>
		<Button kind="danger" on:click={() => deleteProject()}>Delete</Button>
	</row>
</div>

<DeleteProjectModal bind:this={deleteProjectModal} />
