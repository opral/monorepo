<script lang="ts">
	import { Tag, Toggle, TextInput, Button, TextArea, ButtonSet } from 'carbon-components-svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import { database } from '$lib/services/database';
	import type { definitions } from '@inlang/database';
	import { page } from '$app/stores';
	import { cloneDeep, isEqual } from 'lodash-es';
	import ISO6391 from 'iso-639-1';
	import Save32 from 'carbon-icons-svelte/lib/Save32';

	export let translation: Readonly<definitions['translation']>;
	export let isBaseTranslation: Readonly<boolean>;

	let translationCopy = cloneDeep(translation);

	async function handleUpdate() {
		const update = await database
			.from<definitions['translation']>('translation')
			.upsert({ ...translationCopy }, { onConflict: 'iso_code, project_id, key_name' })
			.match({
				project_id: translation.project_id,
				key_name: translation.key_name,
				iso_code: translation.iso_code
			});
		if (update.error) {
			alert(update.error);
		} else {
			projectStore.getData({ projectId: $page.params.projectId });
		}
	}
</script>

<row class="items-center space-x-2 justify-between">
	<row class="items-center">
		{#if isBaseTranslation}
			<Tag type="green">{translation.iso_code}</Tag>
		{:else}
			<Tag type="blue">{translation.iso_code}</Tag>
		{/if}
		{ISO6391.getName(translation.iso_code)}
	</row>
	<row class="items-center">
		<Button
			iconDescription="Save the translation"
			icon={Save32}
			disabled={isEqual(translation, translationCopy)}
			kind="ghost"
			on:click={handleUpdate}>Save</Button
		>
		<Toggle
			class="flex-shrink -mt-4 mr-24"
			labelA="Not approved"
			labelB="Approved"
			disabled={translationCopy.text === '' ||
				$projectStore.data?.translations.includes(translation) === false}
			bind:toggled={translationCopy.is_reviewed}
			on:toggle={handleUpdate}
		/>
	</row>
</row>
<row>
	<TextArea
		class="flex-grow"
		bind:value={translationCopy.text}
		invalid={translationCopy.text === ''}
		invalidText="Missing translation"
		rows={2}
	/>
</row>
