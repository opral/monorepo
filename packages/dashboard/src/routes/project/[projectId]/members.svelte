<script lang="ts">
	import { TextInput, Button, DataTable, Loading } from 'carbon-components-svelte';
	import SendAlt24 from 'carbon-icons-svelte/lib/SendAlt32';
	import Delete24 from 'carbon-icons-svelte/lib/Delete24';
	import type { definitions } from '@inlang/database';
	import { database } from '$lib/services/database';
	import { DatabaseResponse } from '$lib/types/databaseResponse';
	import { projectStore } from '$lib/stores/projectStore';
	import { onMount } from 'svelte';
	import DeleteMemberModal from '$lib/components/modals/DeleteMemberModal.svelte';

	//TODO: reload table on invite and clear text input
	//TODO: fix join, right now user role is hardcoded to admin

	let inputEmail = '';
	let isLoading = true;
	let members: DatabaseResponse<definitions['member'][]>;
	let users: DatabaseResponse<definitions['user'][]>;
	let organizationQuery: DatabaseResponse<definitions['organization'][]>;

	let deleteMemberModal: DeleteMemberModal;

	type Row = {
		id: definitions['user']['id'];
		user: definitions['user'];
		email: definitions['user']['email'];
		role: string;
	};

	let organization_id = $projectStore.data?.project.organization_id;
	let organization: definitions['organization'];

	const headers = [
		{ key: 'email', value: 'Name' },
		{ key: 'role', value: 'Role' },
		{ key: 'remove', empty: true }
	];

	onMount(async () => {
		await loadUsers();
		organizationQuery = await database
			.from<definitions['organization']>('organization')
			.select()
			.match({
				id: organization_id
			});
		if (organizationQuery.data === null || organizationQuery.error) {
			alert(organizationQuery.error?.message);
		} else {
			organization = organizationQuery.data[0];
		}
		isLoading = false;
	});

	async function loadUsers() {
		members = await database.from<definitions['member']>('member').select().match({
			organization_id: organization_id
		});
		if (members.error) {
			alert(members.error.message);
		}
		if (members.data !== null) {
			let user_ids: string[] = members.data.map((member) => member.user_id);

			users = await database.from<definitions['user']>('user').select().in('id', user_ids);
			if (users.error) {
				alert(users.error.message);
			}
		}
	}

	async function inviteUser() {
		let organization_id = $projectStore.data?.project.organization_id;
		let uid_rpc = await database.rpc('get_user_id_from_email', { arg_email: inputEmail });

		if (uid_rpc.error) {
			//alert(uid_rpc.error.message);
		}

		if (uid_rpc.data !== null) {
			let uid = uid_rpc.data[0].get_user_id_from_email;
			let member_upsert = await database.from<definitions['member']>('member').upsert({
				organization_id: organization_id,
				user_id: uid,
				role: 'ADMIN'
			});
			if (member_upsert.status === 409) {
				alert(inputEmail + ' is already a member');
			} else if (member_upsert.status == 400) {
				alert('Invalid email');
			} else if (member_upsert.status === 201) {
				//success
				await loadUsers();
			} else {
				alert('An unknown error occurred');
			}
			inputEmail = '';
		}
	}

    function isOwner(userId: definitions["user"]["id"]): boolean {
        return organization.created_by_user_id === userId;
    }

	let rows: () => Row[];

	$: rows = () => {
		if (isLoading || members.error || members.data === null || users.error || users.data === null) {
			return [];
		}
		return users.data.map((user) => ({
			id: user.id,
			email: user.email,
			role: 'ADMIN',
			user: user
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
		<TextInput size="xl" placeholder="Enter email of user to invite" bind:value={inputEmail} />
		<Button icon={SendAlt24} on:click={() => inviteUser()}>Invite</Button>
	</row>
	<DataTable {headers} rows={rows()}>
		<span slot="cell" let:row let:cell class="cursor-pointer">
			{#if cell.key === 'email'}
				<div class="flex items-center space-x-2">
					<p class="text-sm">{cell.value}</p>
				</div>
			{:else if cell.key === 'role'}
				<div class="flex items-center space-x-2">
					<p class="text-sm">{cell.value}</p>
				</div>
			{:else if cell.key === 'remove'}
				<row class="justify-end items-center">
					<Button
                        disabled={isOwner(row.id)}
						kind="danger-ghost"
						icon={Delete24}
						iconDescription="Remove member"
						on:click={() => {
							deleteMemberModal.show({
								user: row.user,
								organization: organization,
								onUserDeleted: loadUsers
							});
						}}
					/>
				</row>
			{:else}
				{cell.value}
			{/if}
		</span>
	</DataTable>
</div>

<DeleteMemberModal bind:this={deleteMemberModal} />
