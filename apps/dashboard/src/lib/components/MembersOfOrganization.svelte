<script lang="ts">
	import {
		Button,
		DataTable,
		Loading,
		Toolbar,
		ToolbarContent,
		ToolbarBatchActions
	} from 'carbon-components-svelte';
	import Add16 from 'carbon-icons-svelte/lib/Add16';
	import Delete16 from 'carbon-icons-svelte/lib/Delete16';
	import type { definitions } from '@inlang/database';
	import { database } from '$lib/services/database';
	import { DatabaseResponse } from '$lib/types/databaseResponse';
	import { onMount } from 'svelte';
	import DeleteMemberModal from '$lib/components/modals/DeleteMemberModal.svelte';
	import AddMemberModal from './modals/AddMemberModal.svelte';

	export let organization: definitions['organization'];

	let isLoading = true;
	let members: DatabaseResponse<definitions['member'][]>;
	let users: DatabaseResponse<definitions['user'][]>;

	let deleteMemberModal: DeleteMemberModal;
	let addMemberModal: AddMemberModal;

	type Row = {
		id: definitions['user']['id'];
		user: definitions['user'];
		email: definitions['user']['email'];
		//role: string;
	};

	const headers = [
		{ key: 'email', value: 'Member email' },
		//{ key: 'role', value: 'Role' },
		{ key: 'actions', empty: true }
	];

	onMount(async () => {
		await loadUsers();
		isLoading = false;
	});

	async function loadUsers() {
		members = await database.from<definitions['member']>('member').select().match({
			organization_id: organization.id
		});
		if (members.error) {
			alert(members.error.message);
		}
		if (members.data !== null) {
			let userIds: string[] = members.data.map((member) => member.user_id);
			users = await database.from<definitions['user']>('user').select().in('id', userIds);
			if (users.error) {
				alert(users.error.message);
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

<!-- <row class="space-x-4">
	<TextInput
		size="xl"
		placeholder="Enter email of user to invite"
		bind:value={inputEmail}
		invalid={inputEmail.length > 0 && inputIsValidEmail === false}
		invalidText="Invalid email."
	/>
	<Button disabled={inputIsValidEmail === false} icon={SendAlt24} on:click={handleInviteUser}>
		Invite
	</Button>
</row>
<br /> -->
<!-- padding 0 top is neccessary  -->
<DataTable {headers} rows={rows()} class="pt-0">
	<Toolbar>
		<ToolbarBatchActions class="bg-danger">
			<Button icon={Delete16} kind="danger">Delete</Button>
		</ToolbarBatchActions>
		<ToolbarContent>
			<!-- <ToolbarSearch placeholder="Search project" /> -->
			<Button
				icon={Add16}
				on:click={() => addMemberModal.show({ organization, onMemberAdded: loadUsers })}
				>Add member</Button
			>
		</ToolbarContent>
	</Toolbar>
	<span slot="cell" let:row let:cell>
		{#if cell.key === 'email'}
			<row class="items-center space-x-2">
				<p class="text-sm">{cell.value}</p>
			</row>

			<!-- {:else if cell.key === 'role'}
			<row class="items-center space-x-2">
				<p class="text-sm">{cell.value}</p>
			</row> -->
		{:else if cell.key === 'actions'}
			<row class="justify-end items-center">
				<Button
					disabled={isOwner(row.id)}
					kind="ghost"
					icon={Delete16}
					tooltipAlignment="start"
					tooltipPosition="left"
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
<AddMemberModal bind:this={addMemberModal} />
