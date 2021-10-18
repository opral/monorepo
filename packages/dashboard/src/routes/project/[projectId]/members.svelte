<script lang="ts">
    import { TextInput, 
            Button, 
            DataTable, 
            Loading,
            Tag,
            ToastNotification } from "carbon-components-svelte";
    import SendAlt24 from "carbon-icons-svelte/lib/SendAlt32";
    import type { definitions } from '@inlang/database';
	import { database } from '$lib/services/database';
    import { DatabaseResponse } from '$lib/types/databaseResponse';
    import { projectStore } from "$lib/stores/projectStore";
    import { onMount } from "svelte";

    //TODO: reload table on invite and clear text input
    //TODO: fix join, right now user role is hardcoded to admin

    let inputEmail = "";
    let isLoading = true;
    let members: DatabaseResponse<definitions["member"][]>;
    let users: DatabaseResponse<definitions["user"][]>;
    let membersJoined: member_join_user[];
    type member_join_user = {
        id: string,
        email: string
        organization_id: string,
        role: string
    }
    let organization_id = $projectStore.data?.project.organization_id;

    const headers = [
		{ key: 'email', value: 'Name' },
		{ key: 'role', value: 'Role' }
	];

    onMount(async () => {
        await loadUsers();
        isLoading = false;
    })

    async function loadUsers() {
        members = await database.from<definitions["member"]>("member")
            .select()
            .match({
                organization_id: organization_id
            });
        if (members.error) {
            alert(members.error.message);
        }
        if (members.data !== null) {
            let user_ids: string[] = [];
            members.data.map((member) => {
                user_ids.push(member.user_id);
            })
            users = await database.from<definitions["user"]>("user")
                .select()
                .in("id", user_ids);
            if (users.error) {
                alert(users.error.message);
            };
        }
    }

    async function inviteUser(email: string) { 
        let organization_id = $projectStore.data?.project.organization_id;
        let uid_rpc = await database.rpc("get_user_id_from_email", {arg_email: inputEmail});
        
        if (uid_rpc.error) {
            //alert(uid_rpc.error.message);
        }

        if(uid_rpc.data !== null) {
            let uid = uid_rpc.data[0].get_user_id_from_email;
            let member_upsert = await database.from<definitions["member"]>("member")
                .upsert({
                    organization_id: organization_id,
                    user_id: (uid),
                    role: "ADMIN"
                });
            if (member_upsert.status === 409) {
                alert(inputEmail + " is already a member")
            } else if (member_upsert.status == 400) {
                alert("Invalid email")
            } else if (member_upsert.status === 201) {
                //success
                await loadUsers();
            } else {
                alert("An unknown error occurred")
            }
            inputEmail = "";
            
        }

    }

    $: rows_members = () => {
		if (isLoading || members.error || members.data === null || users.error || users.data === null) {
			return [];
		}
        // membersJoined = [];
        // members.data.map((member) => {
        //     membersJoined.push({
        //         id: member.user_id,
        //         email: getEmail(member.user_id),
        //         organization_id: member.organization_id,
        //         role: member.role
        //     });
        // })

        // return membersJoined;

		return users.data
			.map((user) => ({
                id: user.id,
				email: user.email,
				role: 'ADMIN'
			}));
	};

</script>

{#if isLoading}
	<Loading />
{/if}

<div class="p-8">
	<h1>Members</h1>
    <p class="text-gray-600 mt-1 mb-3">Invite members to the organization of current project.</p>

    
    <row class="space-x-4 items-center" style="margin-bottom: 25px;">
    <TextInput size="xl" placeholder="Enter email of user to invite" bind:value={inputEmail}></TextInput>
    <Button  icon={SendAlt24} on:click={() => inviteUser(inputEmail)}>Invite</Button>
    </row>
    <DataTable {headers} rows={rows_members()}>
		<span
			slot="cell"
			let:row
			let:cell
			class="cursor-pointer"
		>
			{#if cell.key === 'name'}
				<div class="flex items-center space-x-2">
					<Tag type="blue">{cell.value.substring(0, 2)}</Tag>
					<p class="text-sm">{cell.value}</p>
				</div>
			{:else if cell.key === 'more'}
				<Button
					kind="ghost"
					iconDescription="More"
					on:click={() => {
						// addMemberModal = row.id;
						// showMoreModal = true;
					}}
				/>
			{:else if cell.key === 'organization'}
				{cell.value}
			{:else}
				{cell.value}
			{/if}
		</span>
	</DataTable>


</div>
