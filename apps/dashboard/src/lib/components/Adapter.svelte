<script lang="ts">
	import { database } from '$lib/services/database';
	import type { definitions } from '@inlang/database';
	import {
		Dropdown,
		Button,
		CodeSnippet,
		TextArea,
		InlineNotification,
		TileGroup,
		RadioTile,
		InlineLoading
	} from 'carbon-components-svelte';
	import DocumentExport32 from 'carbon-icons-svelte/lib/DocumentExport32';
	import DocumentImport32 from 'carbon-icons-svelte/lib/DocumentImport32';
	import ISO6391 from 'iso-639-1';
	import { AdapterInterface, adapters } from '@inlang/adapters';
	import { Resources } from '@inlang/fluent-syntax';

	export let project: definitions['project'];
	export let languages: definitions['language'][];
	export let title = 'Import';
	export let details = 'Select adapter and human language then import your current translations';

	// TODO this whole file should be refactored. Bad coding style.

	let selectedAdapterIndex = 0;
	let selectedAdapter: AdapterInterface;
	$: selectedAdapter = Object.values(adapters)[selectedAdapterIndex];
	let isLoading = false;
	let exportedCode = '';
	let importText = '';
	let selectedLanguageIso: definitions['language']['code'] = project.base_language_code;
	let success = false;

	const baseLanguage: definitions['project']['base_language_code'] = project.base_language_code;

	$: isImport = title === 'Import';
	$: isFileForSelectedLanguage = getFileForLanguageIso(selectedLanguageIso).length > 0;
	$: parserResponse = tryParse(importText);
	$: isParseable = parserResponse === '';
	$: isFormValid = isParseable && selectedLanguageIso !== undefined && importText.length > 0;

	function handleButtonClick(): void {
		isImport ? handleImport() : handleExport();
	}

	function getFileForLanguageIso(iso: string): string {
		for (const language of languages) {
			if (language.code === iso && language.file.length > 0) {
				return language.file;
			}
		}
		return '';
	}

	async function getLanguages(): Promise<void> {
		const selectLanguages = await database
			.from<definitions['language']>('language')
			.select()
			.match({ project_id: project.id })
			.order('code', { ascending: true });
		if (selectLanguages.error) {
			alert(selectLanguages.error.message);
		} else {
			languages = selectLanguages.data;
		}
	}

	function tryParse(text: string): string {
		if (text.length === 0) return '';
		const parsed = selectedAdapter.parse(text);
		if (parsed.isErr) {
			return parsed.error.message;
		}
		return '';
	}

	async function handleImport(): Promise<void> {
		success = false;
		isLoading = true;
		//create and parse
		const api = Resources.parse({
			adapter: selectedAdapter,
			files: [
				{
					languageCode: selectedLanguageIso,
					data: importText
				}
			],
			baseLanguageCode: baseLanguage
		});

		if (api.isErr) {
			alert(api.error.message);
		} else {
			let fluentLanguages = api.value.serialize({ adapter: adapters.fluent });
			if (fluentLanguages.isErr) {
				alert(fluentLanguages.error.message);
			} else {
				let languagesToUpsert: definitions['language'][];
				languagesToUpsert = fluentLanguages.value.map((language) => {
					return {
						project_id: project.id,
						code: language.languageCode,
						file: language.data
					};
				});
				let hasUpsertError;
				for (const element of languagesToUpsert) {
					let upsert = await database
						.from<definitions['language']>('language')
						.update({ file: element.file })
						.match({ project_id: project.id, iso_code: element.code });
					if (upsert.error) {
						hasUpsertError = true;
						alert(upsert.error.message);
					}
				}
				if (!hasUpsertError) {
					isLoading = false;
					success = true;
				}
			}
		}
		getLanguages();
		isLoading = false;
	}

	function handleExport(): void {
		isLoading = true;
		const api = Resources.parse({
			adapter: adapters.fluent,
			files: [
				{
					languageCode: selectedLanguageIso,
					data: getFileForLanguageIso(selectedLanguageIso)
				}
			],
			baseLanguageCode: baseLanguage
		});
		if (api.isOk) {
			let response = api.value.serialize({ adapter: selectedAdapter });
			if (response.isOk) {
				exportedCode = response.value[0].data;
			} else {
				alert(response.error.message);
			}
		} else {
			alert(api.error.message);
		}
		isLoading = false;
	}
</script>

<h1>{title}</h1>
<p class="text-gray-600 mt-1 mb-3">{details}</p>

<div class="flex space-x-10 w-fill mt-10">
	<column class="space-y-10 w-80">
		<Dropdown
			class="w-fill"
			titleText="Select the adapter"
			bind:selectedIndex={selectedAdapterIndex}
			items={Object.entries(adapters).map(([adapterName], index) => ({
				id: '' + index,
				text: adapterName
			}))}
		/>
		<div>
			<p class="text-xs text-gray-600 mb-2">Select the human language</p>
			<div style="height:30em; overflow: auto">
				<TileGroup bind:selected={selectedLanguageIso}>
					{#if languages !== undefined}
						{#each languages as language}
							<RadioTile value={language.code}>
								{ISO6391.getName(language.code)} - {language.code}
							</RadioTile>
						{/each}
					{/if}
				</TileGroup>
			</div>
		</div>
		<div>
			{#if isLoading}
				<InlineLoading />
			{/if}
			{#if isImport && isFileForSelectedLanguage}
				<InlineNotification
					hideCloseButton
					kind="warning"
					title="Existing translations for chosen language will be overwritten"
				/>
			{:else if !isImport && !isFileForSelectedLanguage}
				<InlineNotification
					hideCloseButton
					kind="warning"
					title="No translations exists for chosen language"
				/>
			{:else}
				<Button
					icon={isImport ? DocumentImport32 : DocumentExport32}
					on:click={handleButtonClick}
					disabled={(isImport && !isFormValid) || (!isImport && !isFileForSelectedLanguage)}
					class="w-full"
				>
					{title}
				</Button>
			{/if}
		</div>
	</column>
	<column class="flex-auto space-y-0">
		{#if isImport}
			<TextArea
				labelText="Translations"
				style="height:38.5rem;overflow:auto;"
				placeholder="Paste translation file here"
				bind:value={importText}
				invalid={!isParseable}
				invalidText={parserResponse}
			/>
			{#if success}
				<InlineNotification
					lowContrast={true}
					kind="success"
					title="Success"
					subtitle="Translations sucessfully imported to inlang"
					timeout={3000}
					class="mt-0"
				/>
			{/if}
		{:else}
			<div style="height:40rem;overflow:auto;">
				<p class="text-xs text-gray-600 mb-2">Exported translations</p>
				<CodeSnippet type="multi" expanded={true} code={exportedCode} />
			</div>
		{/if}
	</column>
</div>
