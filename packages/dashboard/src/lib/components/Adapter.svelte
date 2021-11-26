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
	import { TranslationAPI } from '@inlang/common/src/fluent/formatter';
	import ISO6391 from 'iso-639-1';

	export let project: definitions['project'];
	export let languages: definitions['language'][];
	export let title = 'Import';
	export let details = 'Select adapter and human language then import your current translations';

	let createLanguageModal: { show: boolean } = { show: false };
	let selectedAdapterIndex = 0;
	let isAdapting = false;
	let exportedCode = '';
	let importText = '';
	let selectedLanguageIso: definitions['language']['iso_code'] = project.default_iso_code;
	let success = false;

	const baseLanguage: definitions['project']['default_iso_code'] = project.default_iso_code;
	const adapters: string[] = ['Swift', 'Fluent', 'typesafe-i18n'];

	$: isImport = title === 'Import';
	$: isFileForSelectedLanguage = () => {
		if (selectedLanguageIso === undefined || languages === undefined) {
			return false;
		} else {
			for (let i = 0; i < languages.length; i++) {
				if(languages[i].iso_code === selectedLanguageIso && languages[i].file.length > 0) {
					return true
				}
			}
			return false
		}
	};
    $: parserResponse = tryParse(importText);
    $: isParseable = parserResponse === "";
    $: isFormValid = (isParseable && 
                        selectedLanguageIso !== undefined && 
                        selectedAdapterIndex>= 0 &&
                        importText.length > 0);

	function handleButtonClick() {
		isImport ? handleImport() : handleExport();
	}

	async function getLanguages() {
		const selectLanguages = await database
			.from<definitions['language']>('language')
			.select()
			.match({ project_id: project.id })
			.order('iso_code', { ascending: true });
		if (selectLanguages.error) {
			alert(selectLanguages.error.message)
		} else {
			languages = selectLanguages.data;
		}
	}

	function handleExport() {
		isAdapting = true;
		isAdapting = false;
	}

    function tryParse(text: string) {
        console.log("Try Parse")
        if (text.length === 0) return "";
        let adapter;
        let parsed;
        if (selectedAdapterIndex === 0) {
            adapter = new SwiftAdapter();
        } else if (selectedAdapterIndex === 1) {
            adapter = new FluentAdapter();
        } else if (selectedAdapterIndex === 2) {
            adapter = new Typesafei18nAdapter();
        } else {
            return "";
        }
        parsed = adapter.parse(text);
            if (parsed.isErr) {
                return parsed.error.message;
            }
        return "";
    }

	async function handleImport() {
		success = false;
		isAdapting = true;

		if (baseLanguage === undefined || selectedLanguageIso === undefined) {
			// todo throw error
			return;
		}
		if (selectedAdapterIndex === 0) {
			// Swift
			const api = TranslationAPI.parse({
				adapter: new SwiftAdapter(),
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
					let languagesToUpsert: definitions["language"][];
					languagesToUpsert = fluentLanguages.value.map((language) => {
						return {
							project_id: project.id,
							iso_code: language.languageCode,
							file: language.data
						}
					})
					let hasUpsertError;
					for(let i = 0; i < languagesToUpsert.length; i++) {
						let upsert = await database
							.from<definitions['language']>('language')
							.update({file: languagesToUpsert[i].file})
							.match({ project_id: project.id, iso_code: languagesToUpsert[i].iso_code});
						if(upsert.error) {
							hasUpsertError = true;
							alert(upsert.error.message);
						}
					};
					if (!hasUpsertError) {
						isAdapting = false;
						success = true;
					}
				}

			}
		} else if (selectedAdapterIndex === 1) {
			// Fluent
		} else if (selectedAdapterIndex === 2) {
			// Typesafei18n
		}
		getLanguages();
		isAdapting = false;
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
				<TileGroup
						bind:selected={selectedLanguageIso}
					>
						{#if languages !== undefined} 
							{#each languages as language}
								<RadioTile value={language.iso_code}>
									{ISO6391.getName(language.iso_code)} - {language.iso_code}
								</RadioTile>
							{/each}
						{/if}
				</TileGroup>
				{#if isFileForSelectedLanguage()}
				<InlineNotification
					hideCloseButton
					kind="warning"
					title="Existing translations for chosen language will be overwritten"
				/>
			{/if}
			</div>
			
		</div>
		<div>
			<Button 
            icon={isImport ? DocumentImport32 : DocumentExport32} 
            on:click={handleButtonClick}
            disabled={isImport && !isFormValid}
			class="w-full"
        >
            {title}
        </Button
		>
		{#if isAdapting}
		<InlineLoading />
		{/if}
		</div>
		
	</column>
	<column class="flex-auto space-y-0">
		{#if isImport}
			<TextArea
				style="height:40rem;overflow:auto;"
				hideLabel
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
			<CodeSnippet type="multi" code={exportedCode} />
		{/if}
	</column>
</div>

<CreateLanguageModal
	bind:open={createLanguageModal.show}
	on:close={() => {
		createLanguageModal.show = false;
	}}
/>
