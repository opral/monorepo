<script lang="ts">
    // TODO: Implement actual machine translation

    import {Button, Modal, Tab, TabContent, Tabs, TextArea, Tooltip} from "carbon-components-svelte";

    export let open = false;
    export let isMachineTranslation = true; // This should be local settings
    // Default values for understanding, will be removed once implemented
    export let original = "Settings";
    export let translations = {de: "Einstillinger", da: "Indstillinger"}; // Sounds more fun than einstellungen
    export let hasNewTranslations = false; // Will be true when user submits new translations

    let originalTranslations = {...translations};
    let selected = 0;

    function nextTab() {
        if (selected < Object.keys(originalTranslations).length-1) {
            selected++;
        } else {
            hasNewTranslations = true
            open = false;
        }
    }
</script>

<Modal
    bind:open
    modalHeading="Translation Card"
    size="sm"
    primaryButtonText="Confirm translations"
    secondaryButtonText="Cancel"
    on:click:button--secondary={() => (open = false)}
    on:submit={() => {open = false; hasNewTranslations = true}}
    preventCloseOnClickOutside
    hasScrollingContent
    shouldSubmitOnEnter={false}
>
    <Tabs bind:selected>
        {#each Object.keys(originalTranslations) as lang}
            <Tab>{lang}</Tab>
        {/each}
        <div slot="content">
            {#each Object.keys(originalTranslations) as lang}
                <TabContent>
                    <div class="flex items-center">
                        <TextArea labelText="Translated text:" bind:value={translations[lang]}/>
                        <Tooltip direction="left">
                            <p>Reset: Returns text to original translation</p>
                            <p>Reject: Deletes translation</p>
                            <p>Approve: Continue to next translation</p>
                        </Tooltip>
                    </div>
                    <div class="flex justify-center">
                        <div><Button size="field" kind="secondary" on:click={() => translations[lang] = originalTranslations[lang]}>Reset</Button></div>
                        <div><Button size="field" kind="danger" on:click={() => translations[lang] = ""}>Reject</Button></div>
                        <div><Button size="field" disabled={isMachineTranslation === false} on:click={() => nextTab(selected)}>Approve</Button></div>
                    </div>
                    <p class="bx--label">Original Text:</p>
                    <p class="text-sm">{original}</p>
                </TabContent>
            {/each}
        </div>
    </Tabs>
</Modal>