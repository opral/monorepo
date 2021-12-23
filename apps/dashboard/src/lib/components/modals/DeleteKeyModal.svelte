<script lang="ts">
	import { Modal } from 'carbon-components-svelte';
	import { database } from '$lib/services/database';
	import type { definitions } from '@inlang/database';
	import { projectStore } from '$lib/stores/projectStore';
	import { page } from '$app/stores';
	import { FluentAdapter } from '@inlang/common/src/adapters/fluentAdapter';

	export function show(args: { key: string }): void {
		key = args.key;
		open = true;
	}

	export function hide(): void {
		open = false;
	}

	let key: string;
	let open = false;

	async function deleteKey(): Promise<void> {
		const deleteRequest = $projectStore.data?.translations.deleteKey(key);
		if (deleteRequest?.isErr) {
			alert(deleteRequest.error.message);
			return;
		}
		const fluentFiles = $projectStore.data?.translations.serialize(new FluentAdapter());
		if (fluentFiles === undefined || fluentFiles?.isErr) {
			alert(fluentFiles?.error.message);
			return;
		}
		for (const file of fluentFiles.value) {
			const query = await database
				.from<definitions['language']>('language')
				.update({ file: file.data })
				.eq('project_id', $projectStore.data?.project.id ?? '')
				.eq('iso_code', file.languageCode);
			if (query.error) {
				alert(query.error.message);
			}
		}
		projectStore.getData({ projectId: $page.params.projectId });
		open = false;
	}
</script>

<Modal
	bind:open
	danger
	modalHeading={`Delete ${key}`}
	primaryButtonText="Delete"
	secondaryButtonText="Cancel"
	on:click:button--primary={deleteKey}
	on:click:button--secondary={() => (open = false)}
>
	<p>Are you sure? This is a permanent action and cannot be undone.</p>
</Modal>
