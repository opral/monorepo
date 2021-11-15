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
	import { isValidEmail } from '$lib/utils/isValidEmail';
	import type { CreateMemberRequestBody } from '../../api/internal/create-member';

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
		//role: string;
	};

	$: inputIsValidEmail = isValidEmail(inputEmail);

	let organization_id = $projectStore.data?.project.organization_id;
	let organization: definitions['organization'];

	const headers = [
		{ key: 'email', value: 'Name' },
		//{ key: 'role', value: 'Role' },
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

	async function inviteUserSS() {
		const organization_id = $projectStore.data?.project.organization_id;
		const userId = database.auth.user()?.id
		if (organization_id === undefined || userId === undefined) {
			return {
				status: 500
			}
		}

		const body: CreateMemberRequestBody = {
			organizationId: organization_id,
			adminId: userId,
			memberEmail: inputEmail,
			role: "ADMIN"
		};
		const response = await fetch('/api/internal/create-member', {
			method: 'post',
			headers: new Headers({
				'content-type': 'application/json'
			}),
			body: JSON.stringify(body)
		});
		if (response.ok) {
			inputEmail = '';
			await loadUsers();
		} else if (response.status === 500) {
			alert(inputEmail + " is not a user of inlang yet");
		} else  if (response.status === 400) {
			alert("You do not have priviliges to invite new users this organizaiton");
		} else if (response.status === 409) {
			alert(inputEmail + ' is already a member');
		}
		else {
			alert("An unknown error occurred");
		}
	}

	async function handleInviteUser() {
		const organization_id = $projectStore.data?.project.organization_id;
		const userId = await database
			.rpc<string>('get_user_id_from_email', { arg_email: inputEmail })
			.single();
		if (userId.error) {
			alert(userId.error.message);
		} else if (userId.data === null) {
			alert(inputEmail + " is not a user of inlang yet")
		} else {
			const memberUpsert = await database.from<definitions['member']>('member').insert({
				organization_id: organization_id,
				user_id: userId.data,
				role: 'ADMIN'
			});
			if (memberUpsert.error) {
				console.error(memberUpsert.error);
				alert(memberUpsert.error.message);
			}
			if (memberUpsert.status === 409) {
				alert(inputEmail + ' is already a member');
			} else if (memberUpsert.status === 201) {
				//success
				inputEmail = '';
				await loadUsers();
			} else {
				if (memberUpsert.error) {
					alert(memberUpsert.error.message)
				} else {
					alert('An unknown error occurred');
				}
			}
		}
	}

	function isOwner(userId: definitions['user']['id']): boolean {
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

<h1>Members</h1>
<p class="text-gray-600 mt-1 mb-3">Invite members to the organization of current project.</p>
<row class="space-x-4">
	<TextInput
		size="xl"
		placeholder="Enter email of user to invite"
		bind:value={inputEmail}
		invalid={inputEmail.length > 0 && inputIsValidEmail === false}
		invalidText="Invalid email."
	/>
	<Button disabled={inputIsValidEmail === false} icon={SendAlt24} on:click={inviteUserSS}>
		Invite
	</Button>
</row>
<br />
<DataTable {headers} rows={rows()}>
	<span slot="cell" let:row let:cell class="cursor-pointer">
		{#if cell.key === 'email'}
			<row class="items-center space-x-2">
				<p class="text-sm">{cell.value}</p>
			</row>
			<!-- {:else if cell.key === 'role'}
			<row class="items-center space-x-2">
				<p class="text-sm">{cell.value}</p>
			</row> -->
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

<DeleteMemberModal bind:this={deleteMemberModal} />
