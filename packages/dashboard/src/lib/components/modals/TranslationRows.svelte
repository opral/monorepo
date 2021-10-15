<script lang="ts">
	import { Tag, Toggle, TextInput, Button } from 'carbon-components-svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import { database } from '$lib/services/database';
	import type { definitions } from '@inlang/database';
	import { page } from '$app/stores';

	import Checkmark32 from 'carbon-icons-svelte/lib/Checkmark32';
	// is a string but the consuming component passes it down as any
	// eslint-disable-next-line

	export let translation: definitions['translation'];

	async function handleIsReviewedClick(translation: definitions['translation']) {
		translation.is_reviewed = !translation.is_reviewed;
		const update = await database
			.from<definitions['translation']>('translation')
			.update({ is_reviewed: !translation.is_reviewed })
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

	async function handleChangeTranslationClick(
		translation: definitions['translation'],
		newTranslation: string
	) {
		const update = await database
			.from<definitions['translation']>('translation')
			.update({ text: newTranslation })
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
	<!-- locale -->
	<!-- <div>
        {#if row.status === true}
            <Tag type="green">{'Approved'}</Tag>
        {:else}
            <Tag type="red">{'Not approved'}</Tag>
        {/if}
    </div> -->
	<!-- <row class="flex content-center space-x-2 justify-center"> -->
	<!-- svelte-ignore missing-declaration -->

	<!-- <row class="items-center space-x-2"> -->
	<Tag type="blue">{translation.iso_code}</Tag>
	<!--this text should be modifiable -->
	<!-- <div class="text-sm"> {row.object.text} </div> -->
	<TextInput class="flex-grow" bind:value={translation.text} size="sm" />
	<Button
		iconDescription="Change the translation"
		icon={Checkmark32}
		kind="ghost"
		on:click={() => handleChangeTranslationClick(translation, translation.text)}
	/>
	<!-- </row> -->

	<row class="items-center space-x-2">
		<Toggle
			class="flex-shrink -mt-4 mr-24"
			labelA="Not approved"
			labelB="Approved"
			bind:toggled={translation.is_reviewed}
			on:toggle={() => handleIsReviewedClick(translation)}
		/>
	</row>
</row>
