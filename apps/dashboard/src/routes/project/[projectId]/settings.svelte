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
	import Divider from '$lib/layout/Divider.svelte';
	import SelectDefaultHumanLanguageTile from '$lib/components/tiles/SelectHumanSourceLanguageTile.svelte';
	import ConfirmModal from '$lib/components/modals/ConfirmModal.svelte';
	import { LanguageCode, Result } from '@inlang/common';

	let projectName = $projectStore.data?.project.name;

	let confirmModal: ConfirmModal;

	let deleteProjectModal: DeleteProjectModal;

	async function changeDefaultHumanLanguage(args: {
		to: LanguageCode;
	}): Promise<Result<void, Error>> {
		if (args.to === undefined) {
			return Result.err(Error('selectedDefaultLanguage is undefined'));
		}
		const response = await database
			.from<definitions['project']>('project')
			.update({ default_iso_code: args.to })
			.eq('id', $projectStore.data?.project.id ?? '');
		if (response.data && response.error === null) {
			projectStore.getData({ projectId: $projectStore.data?.project.id ?? '' });
			return Result.ok(undefined);
		}
		return Result.err(Error('Database response was not successfull.'));
	}

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
	<h1 class="mb-1">Settings</h1>
	<br />
	<ApiKey apiKey={$projectStore.data?.project.api_key ?? ''} />
	<Divider />
	<p>Rename project</p>
	<br />
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
	<Divider />
	<p class="pt-1">Change the human source language</p>
	<p class="pt-1 pb-2 text-gray-600 text-sm">
		The human source language is the language used during development and acts as source of truth of
		source for the other languages in this project.
	</p>
	<br />
	<SelectDefaultHumanLanguageTile
		showLegend={false}
		selected={$projectStore.data?.project.default_iso_code}
		onSelect={(selectedLanguageCode) =>
			confirmModal.show({
				heading: 'Are you sure?',
				message:
					'You can always change the default human language again but usually there is no reason to do so.',
				danger: false,
				onConfirm: () => changeDefaultHumanLanguage({ to: selectedLanguageCode })
			})}
		possibleLanguageCodes={$projectStore.data?.languages.map((language) => language.iso_code) ?? []}
	/>
	<Divider />
	<Tile>
		<h2>Danger Zone</h2>
		<br />
		<Button icon={Delete16} kind="danger-tertiary" on:click={handleDeleteProjectClick}
			>Delete this project</Button
		>
	</Tile>
	<DeleteProjectModal bind:this={deleteProjectModal} />
</div>

<ConfirmModal bind:this={confirmModal} />
