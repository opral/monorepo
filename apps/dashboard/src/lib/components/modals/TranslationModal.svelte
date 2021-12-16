<script lang="ts">
	import { Modal, TextArea } from 'carbon-components-svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import { database } from '$lib/services/database';
	import type { definitions } from '@inlang/database';
	import { createEventDispatcher } from 'svelte';
	import { LanguageCode } from '@inlang/common';

	export let open = false;
	export let key = '';
	export let translations: { languageCode: LanguageCode; translation: string }[];

	$: missingTranslations = () => {
		if ($projectStore.data?.translations === undefined) throw Error('Projectstore not initialized');
		const missing = $projectStore.data.translations.checkMissingTranslations();
		if (missing.isErr) throw Error('Missing translations not found');
		for (const missingTranslation of missing?.value) {
			if (missingTranslation.key === key) return missingTranslation.languageCodes;
		}
		return [];
	};

	const dispatch = createEventDispatcher();

	async function save() {
		let query;
		for (const t of translations) {
			if (t.translation !== '' && t.translation !== null) {
				if ($projectStore.data?.translations.getTranslation(key, t.languageCode).isOk) {
					$projectStore.data.translations.updateKey(key, t.translation, t.languageCode);
					const fluentFiles = $projectStore.data.translations.getFluentFiles();
					if (fluentFiles.isErr) throw 'Cannot get Fluent file';
					for (const fluentFile of fluentFiles.value) {
						if (fluentFile.languageCode === t.languageCode) {
							query = await database
								.from<definitions['language']>('language')
								.update({ file: fluentFile.data })
								.eq('project_id', $projectStore.data?.project.id ?? '')
								.eq('iso_code', t.languageCode);
						}
					}
				} else {
					if ($projectStore.data === null) throw 'Projectstore not initialized.';
					$projectStore.data?.translations.createTranslation(key, t.translation, t.languageCode);
					const fluentFiles = $projectStore.data.translations.getFluentFiles();
					if (fluentFiles.isErr) throw 'Cannot get Fluent file';
					for (const fluentFile of fluentFiles.value) {
						if (fluentFile.languageCode === t.languageCode) {
							query = await database
								.from<definitions['language']>('language')
								.update({ file: fluentFile.data })
								.eq('project_id', $projectStore.data?.project.id ?? '')
								.eq('iso_code', t.languageCode);
						}
					}
				}
				if (query === undefined) {
					alert('Problem in fluent files');
				} else if (query.error) {
					alert(query.error.message);
				} else {
					dispatch('updateRows');
				}
			}
		}
	}
</script>

<Modal
	bind:open
	modalHeading={key}
	size="sm"
	primaryButtonText="Approve"
	secondaryButtonText="Cancel"
	on:click:button--secondary={() => {
		open = false;
	}}
	on:submit={() => {
		open = false;
		save();
	}}
	preventCloseOnClickOutside
	hasScrollingContent
	shouldSubmitOnEnter={false}
>
	<div>
		{#each translations as translation}
			<div class="flex items-center">
				<TextArea labelText="{translation.languageCode}:" bind:value={translation.translation} />
			</div>
		{/each}
		{#each missingTranslations() as miss}
			<div class="flex items-center">
				<TextArea labelText="{miss}:" />
			</div>
		{/each}
	</div>
</Modal>
