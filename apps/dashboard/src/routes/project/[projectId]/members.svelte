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
	import AddMemberModal from '$lib/components/modals/AddMemberModal.svelte';
	import { page } from '$app/stores';
	import ConfirmModal from '$lib/components/modals/ConfirmModal.svelte';
	import { Result } from '@inlang/common';
	import { auth } from '$lib/services/auth';

	let isLoading = true;
	let members: DatabaseResponse<definitions['project_member'][]>;
	let users: DatabaseResponse<definitions['user'][]>;

	let confirmModal: ConfirmModal;

	let addMemberModal: AddMemberModal;

	const headers = [
		{ key: 'email', value: 'Member email' },
		//{ key: 'role', value: 'Role' },
		{ key: 'actions', empty: true }
	];

	onMount(async () => {
		await loadUsers();
		isLoading = false;
	});

	async function loadUsers(): Promise<void> {
		members = await database.from<definitions['project_member']>('project_member').select().match({
			project_id: $page.params.projectId
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

	async function deleteMember(args: {
		userId: definitions['user']['id'];
	}): Promise<Result<void, Error>> {
		const deletion = await database
			.from<definitions['project_member']>('project_member')
			.delete()
			.match({ project_id: $page.params.projectId, user_id: args.userId });
		if (deletion.error) {
			return Result.err(Error(deletion.error.message));
		}
		await loadUsers();
		return Result.ok(undefined);
	}

	type Row = {
		id: definitions['user']['id'];
		user: definitions['user'];
		//role: string;
	};
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

<h1 class="mb-1">Members</h1>
<p>The members of this project.</p>
<br />
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
				on:click={() =>
					addMemberModal.show({ projectId: $page.params.projectId, onMemberAdded: loadUsers })}
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
					disabled={row.user.id === auth.user()?.id}
					kind="ghost"
					icon={Delete16}
					tooltipAlignment="start"
					tooltipPosition="left"
					iconDescription="Remove member"
					on:click={() => {
						confirmModal.show({
							heading: 'Delete member',
							message: 'Are you sure you want to delete the member?',
							requireTypingOf: row.user.email,
							danger: true,
							onConfirm: () => deleteMember({ userId: row.user.id })
						});
					}}
				/>
			</row>
		{:else}
			{cell.value}
		{/if}
	</span>
</DataTable>

<AddMemberModal bind:this={addMemberModal} />
<ConfirmModal bind:this={confirmModal} />
