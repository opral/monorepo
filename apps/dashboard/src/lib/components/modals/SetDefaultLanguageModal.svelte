<script lang="ts">
	import ISO6391 from 'iso-639-1';
	import { page } from '$app/stores';

	import { database } from '$lib/services/database';
	import { projectStore } from '$lib/stores/projectStore';
	import type { definitions } from '@inlang/database';
	import { InlineLoading, Modal } from 'carbon-components-svelte';
	import type { InlineLoadingProps } from 'carbon-components-svelte/types/InlineLoading/InlineLoading';
	import { autoCloseModalOnSuccessTimeout } from '$lib/utils/timeouts';

	export let open: boolean;
	export let language: definitions['language'];

	let status: InlineLoadingProps['status'] = 'inactive';

	async function handleConfirm(): Promise<void> {
		status = 'active';
		const update = await database
			.from<definitions['project']>('project')
			.update({ default_iso_code: language.iso_code })
			.match({ id: language.project_id });
		if (update.error) {
			console.log(update.error);
			status = 'error';
		} else {
			// refreshing the store to reflect the update
			projectStore.getData({ projectId: $page.params.projectId });
			status = 'finished';
		}
		// automatically closing the modal but leave time to
		// let the user read the result status of the action
		setTimeout(() => {
			open = false;
		}, autoCloseModalOnSuccessTimeout);
		// reset status to inactive
		// happens after previous timeout because
		// of an ongoing animation
		setTimeout(() => {
			status = 'inactive';
		}, autoCloseModalOnSuccessTimeout + 500);
	}
</script>

<!-- Set Default Language Modal -->
<Modal
	size="sm"
	bind:open
	modalHeading="Set as default language"
	primaryButtonText="Confirm"
	secondaryButtonText="Cancel"
	on:click:button--primary={handleConfirm}
	on:click:button--secondary={() => {
		open = false;
	}}
	on:close
>
	{#if status === 'active'}
		<InlineLoading status="active" description="Changing default language..." />
	{:else if status === 'error'}
		<InlineLoading status="error" description="An error occurred" />
	{:else if status === 'finished'}
		<InlineLoading status="finished" description="Success" />
	{:else}
		<p>Do you really want to set {ISO6391.getName(language.iso_code)} as default language?</p>
	{/if}
</Modal>
