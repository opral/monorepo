<script lang="ts">
	import { projectStore } from '$lib/stores/projectStore';
	import TranslationRow from './modals/TranslationRow.svelte';
	import ISO6391 from 'iso-639-1';
	import { difference, concat } from 'lodash-es';
	import type { definitions } from '@inlang/database';
	import { LanguageCode } from '@inlang/common/src/types/languageCode';

	// is a string but the consuming component passes it down as any
	export let keyName: unknown;

	$: translationsForKey = () => {
		const allTranslations = $projectStore.data?.translations.getAllTranslations(keyName as string);
		if (allTranslations?.isOk) {
			return allTranslations.value;
		} else {
			throw allTranslations?.error;
		}
	};

	$: missingIsoCodeRows = () => {
		return difference(
			$projectStore.data?.languages.map((l) => l.iso_code) ?? [],
			translationsForKey().map((t) => t.languageCode)
		)
			.map((iso) => {
				const output: { languageCode: LanguageCode; translation: string | null } = {
					languageCode: iso,
					translation: ''
				};
				return output;
			})
			.concat(translationsForKey());
	};

	$: rows = () => {
		// TODO: sort the organizations alphabetically!
		return missingIsoCodeRows().sort((a, b) => {
			if ($projectStore.data?.project.default_iso_code === a.languageCode ?? []) {
				return -1;
			} else if ($projectStore.data?.project.default_iso_code === b.languageCode ?? []) {
				return 1;
			} else {
				return ISO6391.getName(a.languageCode).localeCompare(ISO6391.getName(b.languageCode));
			}
		});
	};
</script>

{#each rows() as row}
	<TranslationRow
		translation={row}
		isBaseTranslation={row.languageCode === $projectStore.data?.project.default_iso_code}
	/>
{/each}
