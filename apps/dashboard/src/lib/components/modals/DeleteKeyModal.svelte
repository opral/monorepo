<script lang="ts">
	import { Modal } from 'carbon-components-svelte';
	import { database } from '$lib/services/database';
	import type { definitions } from '@inlang/database';
	import { projectStore } from '$lib/stores/projectStore';
	import { page } from '$app/stores';

	export function show(args: { key: string }): void {
		key = args.key;
		open = true;
	}

	export function hide(): void {
		open = false;
	}

	let key: string;
	let open = false;

	async function deleteKey() {
		const deleteReequest = $projectStore.data?.translations.deleteKey(key);
		if (deleteReequest?.isErr) {
			alert(deleteReequest.error.message);
		}
		const fluentFiles = $projectStore.data?.translations.getFluentFiles();
		if (fluentFiles === undefined) throw Error('Fluent files undefined');
		if (fluentFiles.isErr) throw Error('Cannot get fluent files');
		for (const fluentFile of fluentFiles.value) {
			const query = await database
				.from<definitions['language']>('language')
				.update({ file: fluentFile.data })
				.eq('project_id', $projectStore.data?.project.id ?? '')
				.eq('iso_code', fluentFile.languageCode);
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
