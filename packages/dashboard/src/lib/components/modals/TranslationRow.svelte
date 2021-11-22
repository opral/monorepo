<script lang="ts">
	import { Tag, Toggle, TextInput, Button, TextArea, ButtonSet } from 'carbon-components-svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import { database } from '$lib/services/database';
	import type { definitions } from '@inlang/database';
	import { page } from '$app/stores';
	import { cloneDeep, isEqual } from 'lodash-es';
	import ISO6391 from 'iso-639-1';
	import Save32 from 'carbon-icons-svelte/lib/Save32';
	import { LanguageCode } from '@inlang/common/src/types/languageCode';

	export let translation: Readonly<{
		key: string;
		translation: string | undefined;
		languageCode: LanguageCode;
	}>;
	export let isBaseTranslation: Readonly<boolean>;

	let translationCopy = cloneDeep(translation);

	async function handleUpdate() {
		let query;
		if ($projectStore.data === null) throw Error('Projectstore not initialized');
		if (
			$projectStore.data.translations.doesTranslationExist(
				translationCopy.key,
				translationCopy.languageCode
			)
		) {
			$projectStore.data.translations.updateKey(
				translationCopy.key,
				translationCopy.translation,
				translationCopy.languageCode
			);
		} else {
			$projectStore.data.translations.createTranslation(
				translationCopy.key,
				translationCopy.translation,
				translationCopy.languageCode
			);
		}
		const fluentFiles = $projectStore.data.translations.getFluentFiles();
		if (fluentFiles.isErr) throw Error('Cannot get fluent files');
		for (const fluentFile of fluentFiles.value) {
			if (fluentFile.languageCode === translationCopy.languageCode) {
				query = await database
					.from<definitions['language']>('language')
					.update({ file: fluentFile.data })
					.eq('project_id', $projectStore.data?.project.id ?? '')
					.eq('iso_code', translationCopy.languageCode);
				break;
			}
		}

		if (query === undefined) {
			alert('Fluent file not found');
		} else if (query.error) {
			alert(query.error);
		} else {
			projectStore.getData({ projectId: $page.params.projectId });
		}
	}
</script>

<row class="items-center space-x-2 justify-between">
	<row class="items-center">
		{#if isBaseTranslation}
			<Tag type="green">{translation}</Tag>
		{:else}
			<Tag type="blue">{translation.languageCode}</Tag>
		{/if}
		{ISO6391.getName(translation.languageCode)}
	</row>
	<row class="items-center">
		<Button
			iconDescription="Save the translation"
			icon={Save32}
			disabled={isEqual(translation, translationCopy)}
			kind="ghost"
			on:click={handleUpdate}>Save</Button
		>
		<!--<Toggle
			class="flex-shrink -mt-4 mr-24"
			labelA="Not approved"
			labelB="Approved"
			disabled={translationCopy.translation === '' ||
				$projectStore.data?.translations.includes(translation) === false}
			bind:toggled={translationCopy.is_reviewed}
			on:toggle={handleUpdate}
		/>-->
	</row>
</row>
<row>
	<TextArea
		class="flex-grow"
		bind:value={translationCopy.translation}
		invalid={translationCopy.translation === ''}
		invalidText="Missing translation"
		rows={2}
	/>
</row>
