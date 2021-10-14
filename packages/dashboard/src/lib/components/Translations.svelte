<script lang="ts">
	import { Tag, Toggle, TextInput, Button } from 'carbon-components-svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import TranslationRows from './modals/TranslationRows.svelte';

	// is a string but the consuming component passes it down as any
	// eslint-disable-next-line
	export let keyName: any;

	$: rows = () => {
		// TODO: sort the organizations alphabetically
		return (
			$projectStore.data?.translations
				.filter(
					(translation) =>
						//only get the translations that are not the base translations
						translation.iso_code !== $projectStore.data?.project.default_iso_code &&
						//  only get the translations of that key
						translation.key_name === keyName
				)
				.map((translation) => ({
					id: translation.project_id + translation.key_name + translation.iso_code,
					object: translation,
					status: translation.is_reviewed,
					base: $projectStore.data?.translations.find(
						(baseTranslation) =>
							baseTranslation.iso_code === $projectStore.data?.project.default_iso_code &&
							baseTranslation.key_name === translation.key_name
					)?.text,
					locale: translation.iso_code,
					translation: translation.text
					//admin: organization.admin.email,
					//num_projects: organization.projects.length,
					//members: organization.members.length
				})) ?? []
		);
	};
</script>

{#each rows() as row}
	<TranslationRows translation={row.object} />
{/each}
