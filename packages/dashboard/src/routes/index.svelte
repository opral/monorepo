<!-- redirecting the user to the projects -->
<script lang="ts" context="module">
	import { Result } from '@inlang/common/src/types/result';
	import type { LoadOutput } from '@sveltejs/kit';
	import type { definitions } from '@inlang/database';
	import type { DatabaseResponse } from '$lib/types/databaseResponse';
	import { database } from '$lib/services/database';

	let organizations: DatabaseResponse<definitions['organization'][]>;

	export async function load(): Promise<LoadOutput> {
		organizations = await database
			.from<definitions['organization']>('organization')
			.select()
			.order('name');
		return {};
	}
</script>

<script lang="ts">
	import MembersOfOrganization from '$lib/components/MembersOfOrganization.svelte';
	import ProjectsOfOrganization from '$lib/components/ProjectsOfOrganization.svelte';
	import Divider from '$lib/layout/Divider.svelte';
	import { Tab, Tabs, TabContent, Button, Tile } from 'carbon-components-svelte';
	import Add16 from 'carbon-icons-svelte/lib/Add16';
	import Delete16 from 'carbon-icons-svelte/lib/Delete16';

	import { userStore } from '$lib/stores/userStore';
	import { onMount } from 'svelte';
	import ConfirmModal, {
		defaultConfirmModalText
	} from '$lib/components/modals/ConfirmModal.svelte';

	onMount(() => {
		createOrganizationIfNotExists();
	});

	let confirmModal: ConfirmModal;

	// on first registration, the user has no organizations. We create one automatically
	// for better UX.
	async function createOrganizationIfNotExists() {
		if (organizations.data?.length === 0 ?? true) {
			const response = await database.from<definitions['organization']>('organization').insert([
				{
					name: $userStore.data?.email?.split('@')[0] + "'s organization",
					created_by_user_id: $userStore.data?.id
				}
			]);
			if (response.error) {
				alert(response.error);
			} else {
				organizations = await database
					.from<definitions['organization']>('organization')
					.select()
					.order('name');
			}
		}
	}

	async function deleteOrganization(id: definitions['organization']['id']) {
		const result = await database
			.from<definitions['organization']>('organization')
			.delete()
			.match({ organization_id: id });
		if (result.error) {
			return Result.err(Error(result.error.message));
		}
		organizations = await database
			.from<definitions['organization']>('organization')
			.select()
			.order('name');
		return Result.ok(undefined);
	}
</script>

<row class="justify-between items-end">
	<div>
		<h1>Overview</h1>
		<p>Your organizations including their projects, members and settings appear here.</p>
	</div>
	<Button kind="secondary" icon={Add16} size="field">New organization</Button>
</row>
<br />
{#if organizations.data}
	{#each organizations.data as organization, i}
		<h2 class="pb-1 pl-4">{organization.name}</h2>
		<Tabs type="default">
			<Tab label="Projects" />
			<Tab label="Members" />
			<Tab label="Settings" />
			<div slot="content" class="-m-4">
				<TabContent><ProjectsOfOrganization {organization} /></TabContent>
				<TabContent><MembersOfOrganization {organization} /></TabContent>
				<TabContent>
					<Tile>
						<h2>Danger Zone</h2>
						<br />
						<Button
							icon={Delete16}
							kind="danger-tertiary"
							on:click={() => {
								confirmModal.show({
									heading: defaultConfirmModalText.delete.organization.heading,
									message: defaultConfirmModalText.delete.organization.message,
									danger: true,
									requireTypingOf: organization.name,
									onConfirm: async () => {
										return await deleteOrganization(organization.id);
									}
								});
							}}
						>
							Delete this organization
						</Button>
					</Tile>
				</TabContent>
			</div>
		</Tabs>
		{#if i + 1 !== organizations.data.length}
			<Divider class="py-6" />
		{/if}
	{/each}
{/if}

<ConfirmModal bind:this={confirmModal} />
