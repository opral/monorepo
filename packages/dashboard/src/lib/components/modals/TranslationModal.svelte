<script lang="ts">
    // TODO: Implement actual machine translation

    import {Modal, TextArea} from "carbon-components-svelte";
    import {projectStore} from "$lib/stores/projectStore";

    export let open = false;
    export let key = "";
    export let translations = [];

    async function save() {
        for (const t of translations) {
            $projectStore.data.translations.filter((translation) => translation.id === t.id)[0].text = t.text;
        }
    }

</script>

<Modal
    bind:open
    modalHeading={key}
    size="sm"
    primaryButtonText="Approve"
    secondaryButtonText="Cancel"
    on:click:button--secondary={() => {open = false}}
    on:submit={() => {open = false; save()}}
    preventCloseOnClickOutside
    hasScrollingContent
    shouldSubmitOnEnter={false}
>
    <div>
        {#each translations as translation}
            <div class="flex items-center">
                <div class="">
                    <TextArea labelText='{translation.language_iso}:' bind:value={translation.text}/>
                </div>
            </div>
        {/each}
    </div>
</Modal>