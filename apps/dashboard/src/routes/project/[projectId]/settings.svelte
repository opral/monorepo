<script lang="ts">
	import type { definitions } from '@inlang/database';
	import { database } from '$lib/services/database';
	import { projectStore } from '$lib/stores/projectStore';
	import { TextInput, Button, Tile } from 'carbon-components-svelte';
	import DeleteProjectModal from '$lib/components/modals/DeleteProjectModal.svelte';
	import Save16 from 'carbon-icons-svelte/lib/Save16';
	import Delete16 from 'carbon-icons-svelte/lib/Delete16';
	import { goto } from '$app/navigation';
	import ApiKey from '$lib/components/ApiKey.svelte';

	let projectName = $projectStore.data?.project.name;

	let deleteProjectModal: DeleteProjectModal;

	async function renameProject(): Promise<void> {
		const response = await database
			.from<definitions['project']>('project')
			.update({ name: projectName })
			.eq('id', $projectStore?.data?.project.id ?? '');
		if (response.error) {
			alert(response.error);
		} else {
			projectStore.getData({ projectId: $projectStore.data?.project.id ?? '' });
		}
	}

	function handleDeleteProjectClick(): void {
		const project = $projectStore.data?.project;
		if (project === undefined) {
			alert('Error 39jf-9jsa');
			return;
		}
		deleteProjectModal.show({ project, onDeletion: () => goto('/') });
	}
</script>

<div class="max-w-lg">
	<h1>Settings</h1>
	<br />
	<ApiKey apiKey={$projectStore.data?.project.api_key ?? ''} />
	<br />
	<p>Rename project</p>
	<row class="items-start">
		<TextInput
			placeholder="Project Name"
			bind:value={projectName}
			invalid={projectName?.includes(' ')}
			invalidText="The project name can not contain whitespace."
		/>
		<Button
			icon={Save16}
			disabled={projectName === $projectStore.data?.project.name || projectName?.includes(' ')}
			size="field"
			on:click={() => renameProject()}>Save</Button
		>
	</row>
	<br />
	<Tile>
		<h2>Danger Zone</h2>
		<br />
		<Button icon={Delete16} kind="danger-tertiary" on:click={handleDeleteProjectClick}
			>Delete this project</Button
		>
	</Tile>
	<DeleteProjectModal bind:this={deleteProjectModal} />
</div>
