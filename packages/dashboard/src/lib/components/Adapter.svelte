<script lang="ts">
    import { projectStore } from '$lib/stores/projectStore';
    import { database } from '$lib/services/database';
    import CreateLanguageModal from './modals/CreateLanguageModal.svelte';
    import type { definitions } from '@inlang/database';
    import { onMount } from 'svelte';
    import { Dropdown,
            Loading, 
            InlineLoading,
            InlineNotification,
		    NotificationActionButton,
            Button,
            CodeSnippet,
            TextArea } from "carbon-components-svelte";
    import DocumentExport32 from "carbon-icons-svelte/lib/DocumentExport32";
    import DocumentImport32 from "carbon-icons-svelte/lib/DocumentImport32";

    const adapters: string[] = ["Swift", "Test"];
    const languages = $projectStore.data?.languages.map((language) => ({
        iso_code: language.iso_code
    }))

    
    let createLanguageModal: { show: boolean } = { show: false };
    let selectedAdapterIndex = 0;
    let selectedLanguageIndex = 0;
    let isInitialLoading = false;
    let isAdapting = false;
    let selectedLanguageIso: definitions['language']['iso_code'] | 'none' = 'none';

    export let title = "Import"
    export let details = "Select adapter and spoken language then import your current translations"
    $: isImport = title === "Import";

    function handleExport() {
        isAdapting = true;
        isAdapting = false;
    }

    function handleImport() {
        isAdapting = true;
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
                id: ""+index,
                text: adapter
            }))}>
        </Dropdown>
        <div>
            <p 
                class="text-xs text-gray-600 mb-2">
                    Select human language or 
                    <button 
                        class="text-blue-600 underline" 
                        on:click={() => {createLanguageModal.show=true}}>
                            create new language
                    </button>
            </p>
            <Dropdown 
                hideLabel
                class="w-fill"
                titleText="Select human language"
                bind:selectedIndex={selectedLanguageIndex}
                items={languages?.map((language) => ({
                    id: language.iso_code,
                    text: language.iso_code
                }))}
                >
            </Dropdown>
        </div>
        <Button icon={(isImport) ? DocumentImport32 : DocumentExport32}>{title}</Button>
    </column>
    <column class="flex-auto">
        {#if isImport}
        <TextArea
            style="height:40rem"
            hideLabel
            placeholder="Paste translation file here">
        </TextArea>
        {:else}
        <CodeSnippet 
            type="multi"
            skeleton
        >
        </CodeSnippet>
        {/if}
    </column>
</div>

<CreateLanguageModal
	bind:open={createLanguageModal.show}
	on:close={() => {
		createLanguageModal.show = false;
	}}
/>