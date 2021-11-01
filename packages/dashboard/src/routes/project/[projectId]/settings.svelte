<script lang="ts">
	import type { definitions } from '@inlang/database';
	import { database } from '$lib/services/database';
	import { projectStore } from '$lib/stores/projectStore';
	import { CodeSnippet, TextInput, Button, Tile } from 'carbon-components-svelte';
	import DeleteProjectModal from '$lib/components/modals/DeleteProjectModal.svelte';

	let projectName = $projectStore.data?.project.name;

	let deleteProjectModal: DeleteProjectModal;

	async function renameProject() {
		const response = await database
			.from<definitions['project']>('project')
			.update({ name: projectName })
			.eq('id', $projectStore?.data?.project.id ?? '');
		if (response.error) {
			alert(response.error);
		} else {
			alert('Project name has been changed to ' + projectName);
		}
	}

	function handleDeleteProjectClick() {
		const project = $projectStore.data?.project;
		if (project === undefined) {
			alert('Error 39jf-9jsa');
			return;
		}
		deleteProjectModal.show({ project });
	}
</script>

<div class="max-w-lg">
	<h1>Settings</h1>
	<br />
	<p>Project ID:</p>
	<CodeSnippet code={$projectStore.data?.project.id} />
	<br />
	<p>Rename Project:</p>
	<row class="items-center">
		<TextInput placeholder="Project Name" bind:value={projectName} />
		<Button
			disabled={projectName === $projectStore.data?.project.name}
			size="field"
			on:click={() => renameProject()}>Save</Button
		>
	</row>
	<br />

	<Tile>
		<h2>Danger Zone</h2>
		<br />
		<Button kind="danger-tertiary" on:click={handleDeleteProjectClick}>Delete this project</Button>
	</Tile>

	<DeleteProjectModal bind:this={deleteProjectModal} />
</div>
