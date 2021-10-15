<script lang="ts">
	import { Tag, Toggle, TextInput, Button } from 'carbon-components-svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import { database } from '$lib/services/database';
	import type { definitions } from '@inlang/database';
	import { page } from '$app/stores';
	import { cloneDeep, isEqual } from 'lodash';

	import Save32 from 'carbon-icons-svelte/lib/Save32';

	export let translation: Readonly<definitions['translation']>;

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
	<Tag type="blue">{translation.iso_code}</Tag>
	<TextInput
		class="flex-grow"
		bind:value={translationCopy.text}
		size="sm"
		invalid={translationCopy.text === ''}
		invalidText="Missing translation"
	/>
	<Button
		iconDescription="Save the translation"
		icon={Save32}
		disabled={isEqual(translation, translationCopy)}
		kind="ghost"
		on:click={handleUpdate}
	/>

	<row class="items-center space-x-2">
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
