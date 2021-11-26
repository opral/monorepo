<script lang="ts">
	import { projectStore } from '$lib/stores/projectStore';
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
		RadioTile
	} from 'carbon-components-svelte';
	import DocumentExport32 from 'carbon-icons-svelte/lib/DocumentExport32';
	import DocumentImport32 from 'carbon-icons-svelte/lib/DocumentImport32';
	import { SwiftAdapter } from '@inlang/common/src/adapters/swiftAdapter';
	import { FluentAdapter } from '@inlang/common/src/adapters/fluentAdapter';
	import { Typesafei18nAdapter } from '@inlang/common/src/adapters/typesafei18nAdapter';
	import { TranslationAPI } from '@inlang/common/src/fluent/formatter';
	import ISO6391 from 'iso-639-1';

	const adapters: string[] = ['Swift', 'Fluent', 'typesafe-i18n'];
	const languages: definitions['language'][] | undefined = $projectStore.data?.languages;
	const baseLanguage: definitions['project']['default_iso_code'] | undefined =
		$projectStore.data?.project.default_iso_code;

	let createLanguageModal: { show: boolean } = { show: false };
	let selectedAdapterIndex = 0;
	let selectedLanguageIndex = 0;
	let isAdapting = false;
	let exportedCode = '';
	let importText = '';
	let selectedLanguageIso: definitions['language']['iso_code'] | undefined = undefined;

	export let title = 'Import';
	export let details = 'Select adapter and human language then import your current translations';

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
                        selectedLanguageIndex >= 0 && 
                        selectedLanguageIndex >= 0 &&
                        importText.length > 0);

	function handleButtonClick() {
		isImport ? handleImport() : handleExport();
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

	function handleImport() {
		isAdapting = true;

		if (baseLanguage === undefined || selectedLanguageIso === undefined) {
			// todo throw error
			return;
		}
		if (selectedAdapterIndex === 0) {
			// Swift
			const api = TranslationAPI.initialize({
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
				alert("Success");
				//api.value.adapter.serialize()
			}
		} else if (selectedAdapterIndex === 1) {
			// Fluent
		} else if (selectedAdapterIndex === 2) {
			// Typesafei18n
		}
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
			<div style="max-height:30em; overflow: auto">
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
			</div>
			{#if isFileForSelectedLanguage()}
				<InlineNotification
					hideCloseButton
					kind="warning"
					title="Existing translations for chosen language will be overwritten"
				/>
			{/if}
		</div>
		<Button 
            icon={isImport ? DocumentImport32 : DocumentExport32} 
            on:click={handleButtonClick}
            disabled={isImport && !isFormValid}
        >
            {title}
        </Button
		>
	</column>
	<column class="flex-auto space-y-0">
		{#if isImport}
			<TextArea
				style="height:40rem"
				hideLabel
				placeholder="Paste translation file here"
				bind:value={importText}
                invalid={!isParseable}
                invalidText={parserResponse}
			/>
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
