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
	import { TranslationAPI } from '@inlang/common/src/fluent/formatter';
	import { FluentAdapter } from '@inlang/common/src/adapters/fluentAdapter';

	export let translation: Readonly<{
		key: string;
		translation: string | undefined;
		languageCode: LanguageCode;
	}>;
	export let isBaseTranslation: Readonly<boolean>;
	export let missingVariables: {
		[language: string]: { error: string; variable: string };
	};
	export let translationCopy = cloneDeep(translation);

	$: getError = () => {
		if (translationCopy.translation === '') return 'Missing translation';
		if (Object.keys(missingVariables).find((language) => language === translationCopy.languageCode))
			return (
				missingVariables[translationCopy.languageCode].variable +
				missingVariables[translationCopy.languageCode].error
			);
		return '';
	};

	async function handleUpdate() {
		let query, error;
		if ($projectStore.data === null) throw Error('Projectstore not initialized');
		if (
			$projectStore.data.translations.doesTranslationExist(
				translationCopy.key,
				translationCopy.languageCode
			)
		) {
			error = $projectStore.data.translations.updateKey(
				translationCopy.key,
				translationCopy.translation,
				translationCopy.languageCode
			);
		} else {
			error = $projectStore.data.translations.createTranslation(
				translationCopy.key,
				translationCopy.translation,
				translationCopy.languageCode
			);
		}
		if (error.isErr) alert(error.error);
		const fluentFiles = $projectStore.data.translations.serialize(new FluentAdapter());
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
			<Tag type="green">{translation.languageCode}</Tag>
			{ISO6391.getName(translation.languageCode)} - Base Translation
		{:else}
			<Tag type="blue">{translation.languageCode}</Tag>
			{ISO6391.getName(translation.languageCode)}
		{/if}
	</row>
	<row class="items-center">
		<Button
			iconDescription="Save the translation"
			icon={Save32}
			disabled={isEqual(translation, translationCopy) || getError() !== ''}
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
		invalid={getError() !== ''}
		invalidText={getError()}
		rows={2}
	/>
</row>
