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
	import SelectHumanLanguageTile from '$lib/components/tiles/SelectHumanLanguageTile.svelte';
	import ConfirmModal from '$lib/components/modals/ConfirmModal.svelte';
	import { LanguageCode, Result } from '@inlang/common';
	import { t } from '$lib/services/i18n';

	let projectName = $projectStore.data?.project.name;

	let confirmModal: ConfirmModal;

	let deleteProjectModal: DeleteProjectModal;

	async function changeHumanBaseLanguage(args: { to: LanguageCode }): Promise<Result<void, Error>> {
		if (args.to === undefined) {
			return Result.err(Error('selectedDefaultLanguage is undefined'));
		}
		const response = await database
			.from<definitions['project']>('project')
			.update({ base_language_code: args.to })
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
	<h1 class="mb-1">{$t('generic.settings')}</h1>
	<br />
	<ApiKey apiKey={$projectStore.data?.project.api_key ?? ''} />
	<Divider />
	<p>{$t('rename-project')}</p>
	<br />
	<row class="items-start">
		<TextInput
			placeholder="Project Name"
			bind:value={projectName}
			invalid={projectName?.includes(' ')}
			invalidText={$t('error.project-whitespace')}
		/>
		<Button
			icon={Save16}
			disabled={projectName === $projectStore.data?.project.name || projectName?.includes(' ')}
			size="field"
			on:click={() => renameProject()}>{$t('generic.save')}</Button
		>
	</row>
	<Divider />
	<p class="pt-1">{$t('change-base-language')}</p>
	<p class="pt-1 pb-2 text-gray-600 text-sm">
		{$t('definition.base-language')}
	</p>
	<br />
	<SelectHumanLanguageTile
		selected={$projectStore.data?.project.base_language_code}
		onSelect={(selectedLanguageCode) =>
			confirmModal.show({
				heading: $t('confirm.are-you-sure'),
				message: $t('info.change-base-language'),
				danger: false,
				onConfirm: () => changeHumanBaseLanguage({ to: selectedLanguageCode })
			})}
		possibleLanguageCodes={$projectStore.data?.languages.map((language) => language.code) ?? []}
	/>
	<Divider />
	<Tile>
		<h2>{$t('danger-zone')}</h2>
		<br />
		<Button icon={Delete16} kind="danger-tertiary" on:click={handleDeleteProjectClick}
			>{$t('delete.project')}</Button
		>
	</Tile>
	<DeleteProjectModal bind:this={deleteProjectModal} />
</div>

<ConfirmModal bind:this={confirmModal} />
