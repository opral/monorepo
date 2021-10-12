<script lang="ts">
	import { Modal, TextArea } from 'carbon-components-svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import { database } from '$lib/services/database';
	import type { definitions } from '@inlang/database';
	import { createEventDispatcher } from 'svelte';

	export let open = false;
	export let key = '';
	export let translations: definitions['translations'][] = [];

	$: isBaseTranslationMissing = !translations.some(
		(t) => t.text !== '' && t.iso_code === $projectStore.data.project.default_iso_code
	);

	$: missingTranslations = $projectStore.data.languages.filter((language) =>
		$projectStore.data.translations
			.map((translation) => translation.iso_code)
			.includes(language.iso_code === false)
	);

	const dispatch = createEventDispatcher();

	async function save() {
		let query;
		for (const t of translations) {
			if (t.text !== '') {
				if (
					$projectStore.data.translations.some(
						(translation) =>
							translation.iso_code === t.iso_code &&
							translation.key_name === key &&
							translation.project_id === $projectStore.data.project.id
					)
				) {
					query = await database
						.from<definitions['translation']>('translation')
						.update({ text: t.text })
						.eq('key_name', t.key_name)
						.eq('project_id', $projectStore.data.project.id)
						.eq('iso_code', t.iso_code);
				} else {
					query = await database.from<definitions['translation']>('translation').insert({
						project_id: $projectStore.data.project.id,
						key_name: key,
						iso_code: t.iso_code,
						is_reviewed: false,
						text: t.text
					});
				}
				if (query.error) {
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
				<TextArea labelText="{translation.iso_code}:" bind:value={translation.text} />
			</div>
		{/each}
		{#each missingTranslations as miss}
			<div class="flex items-center">
				<TextArea labelText="{missingTranslations.iso_code}:" />
			</div>
		{/each}
	</div>
</Modal>
