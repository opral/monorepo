<script lang="ts">
    // TODO: Implement actual machine translation

    import {Modal, TextArea} from "carbon-components-svelte";
    import {projectStore} from "$lib/stores/projectStore";
    import {database} from "$lib/services/database";

    export let open = false;
    export let key = "";
    export let translations = [];

    async function save() {
        for (const t of translations) {
            const update = await database.from('translation').update({text: t.text}).eq('id', t.id);
            if (update.error) {
                alert(update.error);
            } else {
                $projectStore.data.translations.filter((translation) => translation.id === t.id)[0].text = t.text;
            }
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