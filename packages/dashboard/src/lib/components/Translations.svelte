<script lang="ts">
	import { Tag, Toggle, TextInput, Button } from 'carbon-components-svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import TranslationRow from './modals/TranslationRow.svelte';
	import ISO6391 from 'iso-639-1';
	import { difference, isPlainObject } from 'lodash';
	import type { definitions } from '@inlang/database';

	// is a string but the consuming component passes it down as any
	// eslint-disable-next-line
	export let keyName: any;

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
		).map((iso) => {
			return <definitions['translation']>{
				iso_code: iso,
				is_reviewed: false,
				key_name: keyName,
				project_id: $projectStore.data?.project.id,
				text: ''
			};
		});
	};

	$: rows = () => {
		// TODO: sort the organizations alphabetically!
		return (
			translationsForKey.sort((a, b) =>
				ISO6391.getName(a.iso_code).localeCompare(ISO6391.getName(b.iso_code))
			) ?? []
		);
	};
</script>

{#each missingIsoCodeRows() as row}
	<TranslationRow translation={row} />
{/each}
{#each rows() as row}
	<TranslationRow translation={row} />
{/each}
