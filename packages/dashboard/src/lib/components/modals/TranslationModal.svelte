<script lang="ts">
    // TODO: Implement actual machine translation

    import {Button, ButtonSet, Modal, Tab, TabContent, Tabs, TextArea} from "carbon-components-svelte";

    export let isOpen = false;
    export let isMachineTranslation = true; // This should be local settings
    // Default values for understanding, will be removed once implemented
    export let original = "Settings";
    export let translations = {de: "Einstillinger", da: "Indstillinger"}; // Sounds more fun than einstellungen
    export let hasNewTranslations = false; // Will be true when user submits new translations

    let originalTranslations = {...translations};
</script>

<Modal
        bind:open={isOpen}
    modalHeading="Translation Card"
    size="sm"
    hasform
    primaryButtonText="Confirm translations"
    secondaryButtonText="Cancel"
    on:click:button--secondary={() => (isOpen = false)}
    on:submit={() => {isOpen = false; hasNewTranslations = true}}
    preventCloseOnClickOutside
>
        <Tabs>
            {#each Object.keys(originalTranslations) as lang}
                <Tab>{lang}</Tab>
            {/each}
            <div slot="content">
                {#each Object.keys(originalTranslations) as lang}
                <TabContent>
                    <TextArea rows={10} labelText="Translated text:" bind:value={translations[lang]}/>
                    <ButtonSet>
                        <Button kind="secondary" on:click={() => translations[lang] = originalTranslations[lang]}>Reset</Button>
                        <Button disabled={isMachineTranslation === false} on:click={() => translations[lang] += " but cooler"}>Machine Translation</Button>
                    </ButtonSet>
                    <TextArea rows={10} labelText="Original text:" disabled placeholder={original}/>
                </TabContent>
                {/each}
            </div>
        </Tabs>
</Modal>