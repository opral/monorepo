<script lang="ts">
	import { database } from '$lib/services/database';
	import CreateLanguageModal from './modals/CreateLanguageModal.svelte';
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
	import { SwiftAdapter } from '@inlang/common/src/adapters/swiftAdapter';
	import { FluentAdapter } from '@inlang/common/src/adapters/fluentAdapter';
	import { Typesafei18nAdapter } from '@inlang/common/src/adapters/typesafei18nAdapter';
	import { AdapterInterface } from '@inlang/common/src/adapters';
	import { TranslationAPI } from '@inlang/common/src/fluent/formatter';
	import ISO6391 from 'iso-639-1';

	export let project: definitions['project'];
	export let languages: definitions['language'][];
	export let title = 'Import';
	export let details = 'Select adapter and human language then import your current translations';

	let createLanguageModal: { show: boolean } = { show: false };
	let selectedAdapterIndex = 0;
	let isLoading = false;
	let exportedCode = '';
	let importText = '';
	let selectedLanguageIso: definitions['language']['iso_code'] = project.default_iso_code;
	let success = false;

	const baseLanguage: definitions['project']['default_iso_code'] = project.default_iso_code;
	const adapters: string[] = ['Swift', 'Fluent', 'typesafe-i18n'];

	$: isImport = title === 'Import';
	$: isFileForSelectedLanguage = getFileForLanguageIso(selectedLanguageIso).length > 0;
	$: parserResponse = tryParse(importText, selectedAdapterIndex);
	$: isParseable = parserResponse === '';
	$: isFormValid =
		isParseable &&
		selectedLanguageIso !== undefined &&
		selectedAdapterIndex >= 0 &&
		importText.length > 0;

	function handleButtonClick() {
		isImport ? handleImport() : handleExport();
	}

	function getFileForLanguageIso(iso: string) {
		for (let i = 0; i < languages.length; i++) {
			if (languages[i].iso_code === iso && languages[i].file.length > 0) {
				return languages[i].file;
			}
		}
		return '';
	}

	async function getLanguages() {
		const selectLanguages = await database
			.from<definitions['language']>('language')
			.select()
			.match({ project_id: project.id })
			.order('iso_code', { ascending: true });
		if (selectLanguages.error) {
			alert(selectLanguages.error.message);
		} else {
			languages = selectLanguages.data;
		}
	}

	function tryParse(text: string, adapterIndex: number) {
		if (text.length === 0) return '';
		let parsed;
		let adapter: AdapterInterface;
		if (adapterIndex === 0) {
			adapter = new SwiftAdapter();
		} else if (adapterIndex === 1) {
			adapter = new FluentAdapter();
		} else if (adapterIndex === 2) {
			adapter = new Typesafei18nAdapter();
		} else {
			return '';
		}
		parsed = adapter.parse(text);
		if (parsed.isErr) {
			return parsed.error.message;
		}
		return '';
	}

	async function handleImport() {
		success = false;
		isLoading = true;
		let adapter: AdapterInterface;

		if (selectedAdapterIndex === 0) {
			// Swift
			adapter = new SwiftAdapter();
		} else if (selectedAdapterIndex === 1) {
			// Fluent
			adapter = new FluentAdapter();
		} else {
			// Typesafei18n
			adapter = new Typesafei18nAdapter();
		}
		//create and parse
		const api = TranslationAPI.parse({
			adapter: adapter,
			files: [
				{
					languageCode: selectedLanguageIso,
					data: importText
				}
			],
			baseLanguage: baseLanguage
		});

		if (api.isErr) {
			alert(api.error.message);
		} else {
			let fluentLanguages = api.value.serialize(new FluentAdapter());
			if (fluentLanguages.isErr) {
				alert(fluentLanguages.error.message);
			} else {
				let languagesToUpsert: definitions['language'][];
				languagesToUpsert = fluentLanguages.value.map((language) => {
					return {
						project_id: project.id,
						iso_code: language.languageCode,
						file: language.data
					};
				});
				let hasUpsertError;
				for (let i = 0; i < languagesToUpsert.length; i++) {
					let upsert = await database
						.from<definitions['language']>('language')
						.update({ file: languagesToUpsert[i].file })
						.match({ project_id: project.id, iso_code: languagesToUpsert[i].iso_code });
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

	function handleExport() {
		isLoading = true;
		let adapter: AdapterInterface;
		if (selectedAdapterIndex === 0) {
			// Swift
			adapter = new SwiftAdapter();
		} else if (selectedAdapterIndex === 1) {
			// Fluent
			adapter = new FluentAdapter();
		} else {
			// Typesafei18n
			adapter = new Typesafei18nAdapter();
		}
		const api = TranslationAPI.parse({
			adapter: new FluentAdapter(),
			files: [
				{
					languageCode: selectedLanguageIso,
					data: getFileForLanguageIso(selectedLanguageIso)
				}
			],
			baseLanguage: baseLanguage
		});
		if (api.isOk) {
			let response = api.value.serialize(adapter);
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
			titleText="Select adapter"
			bind:selectedIndex={selectedAdapterIndex}
			items={adapters.map((adapter, index) => ({
				id: '' + index,
				text: adapter
			}))}
		/>
		<div>
			<p class="text-xs text-gray-600 mb-2">
				Select human language or
				<button
					class="text-blue-600 underline"
					on:click={() => {
						createLanguageModal.show = true;
					}}
				>
					create new language
				</button>
			</p>
			<div style="height:30em; overflow: auto">
				<TileGroup bind:selected={selectedLanguageIso}>
					{#if languages !== undefined}
						{#each languages as language}
							<RadioTile value={language.iso_code}>
								{ISO6391.getName(language.iso_code)} - {language.iso_code}
							</RadioTile>
						{/each}
					{/if}
				</TileGroup>
			</div>
		</div>
		<div>
			<Button
				icon={isImport ? DocumentImport32 : DocumentExport32}
				on:click={handleButtonClick}
				disabled={(isImport && !isFormValid) || (!isImport && !isFileForSelectedLanguage)}
				class="w-full"
			>
				{title}
			</Button>
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
<<<<<<< HEAD
			<div style="height:40rem;overflow:auto;">
				<p class="text-xs text-gray-600 mb-2">
					Exported translations
				</p>
				<CodeSnippet 
					type="multi"
					expanded={true}
					code={exportedCode} 
				/>
=======
			<div style="height:40rem;overflow:auto">
				<p class="text-xs text-gray-600 mb-2">Exported translations</p>
				<CodeSnippet type="multi" code={exportedCode} />
>>>>>>> e883d1ac6e986548736eb5f53da39f68268b256f
			</div>
		{/if}
	</column>
</div>

<CreateLanguageModal
	bind:open={createLanguageModal.show}
	on:close={() => {
		createLanguageModal.show = false;
	}}
/>
