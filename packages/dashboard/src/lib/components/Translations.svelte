<script lang="ts">
	import { projectStore } from '$lib/stores/projectStore';
	import TranslationRow from './modals/TranslationRow.svelte';
	import ISO6391 from 'iso-639-1';
	import { difference, concat } from 'lodash-es';
	import type { definitions } from '@inlang/database';

	// is a string but the consuming component passes it down as any
	export let keyName: unknown;

	$: translationsForKey =
		$projectStore.data?.translations.filter(
			(translation) =>
				//only get the translations that are not the base translations
				//translation.iso_code !== $projectStore.data?.project.default_iso_code &&
				//  only get the translations of that key
				translation.key_name === keyName
		) ?? [];

	$: missingIsoCodeRows = () => {
		return difference(
			$projectStore.data?.languages.map((l) => l.iso_code) ?? [],
			translationsForKey.map((t) => t.iso_code)
		)
			.map((iso) => {
				return <definitions['translation']>{
					iso_code: iso,
					is_reviewed: false,
					key_name: keyName,
					project_id: $projectStore.data?.project.id,
					text: ''
				};
			})
			.concat(translationsForKey);
	};

	$: rows = () => {
		// TODO: sort the organizations alphabetically!
		return missingIsoCodeRows().sort((a, b) => {
			if ($projectStore.data?.project.default_iso_code === a.iso_code ?? []) {
				return -1;
			} else if ($projectStore.data?.project.default_iso_code === b.iso_code ?? []) {
				return 1;
			} else {
				return ISO6391.getName(a.iso_code).localeCompare(ISO6391.getName(b.iso_code));
			}
		});
	};
</script>

{#each rows() as row}
	<TranslationRow
		translation={row}
		isBaseTranslation={row.iso_code === $projectStore.data?.project.default_iso_code}
	/>
{/each}
