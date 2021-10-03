<script lang="ts">
    // TODO: Implement actual machine translation

    import {Modal, TextArea} from "carbon-components-svelte";
    import {projectStore} from "$lib/stores/projectStore";
    import {database} from "$lib/services/database";
    import {page} from "$app/stores";

    export let open = false;
    export let rows;
    export let largestTableId;
    let key, description;

    async function save() {
        const insert = await database.from('key').insert({project_id: $page.path.split('/')[2], name: key, description: description})
        if (insert.error) {
            alert(insert.error);
        } else {
            let translations = [];
            for (const lang of $projectStore.data.languages) {
                translations.push({
                    key_id: insert.data[0].id,
                    language_iso: lang.iso_code,
                    is_reviewed: false,
                    text: "Nothing yet"
                })
            }
            const insertTranslations = await database.from('translation').insert(translations);
            projectStore.getData({ projectId: $page.params.projectId });
            console.log(insertTranslations);
            rows.push({'id': largestTableId+1,
                'key': key,
                'description': description,
                'translations': insertTranslations.data[0],
            })
            largestTableId++;
        }
    }

</script>

<Modal
        bind:open
        modalHeading="Create key"
        size="sm"
        primaryButtonText="Create"
        secondaryButtonText="Cancel"
        on:click:button--secondary={() => {open = false}}
        on:submit={() => {open = false; save()}}
        preventCloseOnClickOutside
        hasScrollingContent
        shouldSubmitOnEnter={false}
>
    <div>
        <div class="flex items-center">
            <TextArea labelText='Key:' bind:value={key}/>
        </div>
        <div class="flex items-center">
            <TextArea labelText='Description:' bind:value={description}/>
        </div>
    </div>
</Modal>