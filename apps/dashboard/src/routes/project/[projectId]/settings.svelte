<script lang="ts">
	import { projectStore } from '$lib/stores/projectStore';
	import { TextInput, Button, Tile } from 'carbon-components-svelte';
	import Save16 from 'carbon-icons-svelte/lib/Save16';
	import Delete16 from 'carbon-icons-svelte/lib/Delete16';
	import { goto } from '$app/navigation';
	import ApiKey from '$lib/components/ApiKey.svelte';
	import Divider from '$lib/layout/Divider.svelte';
	import SelectHumanLanguageTile from '$lib/components/tiles/SelectHumanLanguageTile.svelte';
	import ConfirmModal from '$lib/components/modals/ConfirmModal.svelte';
	import { LanguageCode, Result } from '@inlang/utils';
	import { t } from '$lib/services/i18n';

	let projectName = $projectStore.data?.project.name;

	let confirmModal: ConfirmModal;

	async function changeHumanBaseLanguage(args: { to: LanguageCode }): Promise<Result<void, Error>> {
		if (args.to === undefined) {
			return Result.err(Error('selectedDefaultLanguage is undefined'));
		}
		// const response = await database
		// 	.from<definitions['project']>('project')
		// 	.update({ base_language_code: args.to })
		// 	.eq('id', $projectStore.data?.project.id ?? '');
		// if (response.data && response.error === null) {
		// 	projectStore.getData({ projectId: $projectStore.data?.project.id ?? '' });
		// 	return Result.ok(undefined);
		// }
		return Result.err(Error('Database response was not successfull.'));
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
		<!-- <Button icon={Delete16} kind="danger-tertiary" on:click={handleDeleteProjectClick}
			>{$t('delete.project')}</Button
		> -->
	</Tile>
</div>

<ConfirmModal bind:this={confirmModal} />
