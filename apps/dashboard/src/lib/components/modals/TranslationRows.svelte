<script lang="ts">
	import { Tag, Toggle, TextInput, Button } from 'carbon-components-svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import { database } from '$lib/services/database';
	import type { definitions } from '@inlang/database';
	import { page } from '$app/stores';

	import Checkmark32 from 'carbon-icons-svelte/lib/Checkmark32';
	import { LanguageCode } from '@inlang/common/src/types/languageCode';
	// is a string but the consuming component passes it down as any
	// eslint-disable-next-line

	export let translation: { key: string; translation: string; languageCode: LanguageCode };

	/*async function handleIsReviewedClick(translation: definitions['translation']) {
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
	}*/

	async function handleChangeTranslationClick(
		translation: { key: string; translation: string; languageCode: LanguageCode },
		newTranslation: string
	) {
		$projectStore.data?.translations.updateKey(
			translation.key,
			translation.translation,
			translation.languageCode
		);
		if ($projectStore.data === null) throw 'Projectstore not initialized';
		const fluentFiles = $projectStore.data.translations.getFluentFiles();
		if (fluentFiles.isErr) throw Error('Cannot get fluent files');
		let query;
		for (const fluentFile of fluentFiles.value) {
			if (fluentFile.languageCode === translation.languageCode) {
				query = await database
					.from<definitions['language']>('language')
					.update({ file: fluentFile.data })
					.eq('project_id', $projectStore.data?.project.id ?? '')
					.eq('iso_code', translation.languageCode);
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
	<Tag type="blue">{translation.languageCode}</Tag>
	<!--this text should be modifiable -->
	<!-- <div class="text-sm"> {row.object.text} </div> -->
	<TextInput class="flex-grow" bind:value={translation.translation} size="sm" />
	<Button
		iconDescription="Change the translation"
		icon={Checkmark32}
		kind="ghost"
		on:click={() => handleChangeTranslationClick(translation, translation.translation)}
	/>
	<!-- </row> -->

	<!--<row class="items-center space-x-2">
		<Toggle
			class="flex-shrink -mt-4 mr-24"
			labelA="Not approved"
			labelB="Approved"
			bind:toggled={translation.is_reviewed}
			on:toggle={() => handleIsReviewedClick(translation)}
		/>
	</row>-->
</row>
