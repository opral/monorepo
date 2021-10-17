<script lang="ts">
    import { TextInput, Button, DataTable } from "carbon-components-svelte";
    import SendAlt24 from "carbon-icons-svelte/lib/SendAlt32";
    import type { definitions } from '@inlang/database';
	import { database } from '$lib/services/database';
    import { projectStore } from "$lib/stores/projectStore";

    let inputEmail = "";

    async function inviteUser(email: string) { 
        console.log("input email: " + inputEmail);
        let organization_id = $projectStore.data?.project.organization_id;

        let uid_rpc = await database.rpc("get_user_id_from_email", {arg_email: inputEmail});
        
        if (uid_rpc.error) {
            console.error(uid_rpc.error.message);
        }

        if(uid_rpc.data !== null) {
            let uid = uid_rpc.data[0].get_user_id_from_email;
            let member_upsert = await database.from<definitions["member"]>("member")
                .upsert({
                    organization_id: organization_id,
                    user_id: (uid),
                    role: "ADMIN"
                });
            console.log("invite response: " + member_upsert.statusText + ", " + member_upsert.status);
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
