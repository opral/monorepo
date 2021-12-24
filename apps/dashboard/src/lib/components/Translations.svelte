<script lang="ts">
	import { projectStore } from '$lib/stores/projectStore';
	import TranslationRow from './modals/TranslationRow.svelte';
	import ISO6391 from 'iso-639-1';
	import { LanguageCode } from '@inlang/common';

	// is a string but the consuming component passes it down as any
	export let keyName: string;

	$: translationsForKey = () => {
		const allTranslations = $projectStore.data?.translations.getAllTranslations(keyName);
		if (allTranslations?.isOk) {
			return allTranslations.value;
		} else {
			return [];
		}
	};

	$: missingIsoCodeRows = () => {
		const missingTranslations = $projectStore.data?.translations.checkMissingTranslationsForKey(
			keyName
		);
		if (missingTranslations === undefined) throw 'Fluent file error';
		if (missingTranslations?.isErr) throw missingTranslations.error;
		const out: { key: string; languageCode: LanguageCode; translation: string | undefined }[] = [];
		for (const key of missingTranslations.value) {
			out.push({ key: key.key, languageCode: key.languageCode, translation: undefined });
		}
		return [...out, ...translationsForKey()];
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

	$: missingVariables = (
		rows: { key: string; languageCode: LanguageCode; translation?: string }[]
	) => {
		if (rows[0] === undefined) {
			return {};
		}
		const missingVariables = $projectStore.data?.translations.compareVariables(
			rows,
			rows.find((row) => row.languageCode === $projectStore.data?.project.default_iso_code)
		);
		if (missingVariables?.isErr) throw missingVariables.error;
		return missingVariables?.value ?? {};
	};

	let translations = $projectStore.data?.translations.getAllTranslations(keyName);
	if (translations?.isErr) throw translations.error;
	let translationCopy: {
		key: string;
		languageCode: LanguageCode;
		translation: string | undefined;
	}[] = [];
</script>

{#each rows() as row, i}
	<TranslationRow
		translation={row}
		isBaseTranslation={row.languageCode === $projectStore.data?.project.default_iso_code}
		missingVariables={missingVariables(translationCopy)}
		bind:translationCopy={translationCopy[i]}
	/>
{/each}
