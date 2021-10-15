<script lang="ts">
    import { TextInput, Button } from "carbon-components-svelte";
    import SendAlt24 from "carbon-icons-svelte/lib/SendAlt32";
    import type { definitions } from '@inlang/database';
    import { DatabaseResponse } from '$lib/types/databaseResponse';
	import { database } from '$lib/services/database';
    import { projectStore } from "$lib/stores/projectStore";

    let inputEmail = "";

    async function inviteUser(email: string) {
        let organization_id = $projectStore.data?.project.organization_id;
        let user_id = await database.rpc("get_user_id_from_email", {email: inputEmail})
        if(user_id.data!.length > 0) {
            console.log("invite user: " + user_id.data![0].RETURN);
        }
    }

</script>

<div class="p-8">
	<h1>Members</h1>
    <p class="text-gray-600 mt-1 mb-3">Invite members to the organization of current project.</p>

    
    <row class="space-x-4 items-center">
    <TextInput size="xl" placeholder="Enter email of user to invite" bind:value={inputEmail}></TextInput>
    <Button  icon={SendAlt24} on:click={() => inviteUser(inputEmail)}>Invite</Button>
    </row>
</div>
