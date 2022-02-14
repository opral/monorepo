<script lang="ts">
	import { Modal } from 'carbon-components-svelte';
	import { database } from '$lib/services/database';
	import { t } from '$lib/services/i18n';
	import type { definitions } from '@inlang/database';

	export function show(args: { project: definitions['project']; onDeletion: () => unknown }): void {
		project = args.project;
		onDeletion = args.onDeletion;
		open = true;
	}

	export function hide(): void {
		open = false;
	}

	let project: definitions['project'] | undefined;
	let onDeletion: () => unknown;
	let open = false;

	async function deleteProject(): Promise<void> {
		const deleteRequest = await database
			.from<definitions['project']>('project')
			.delete()
			.eq('id', project?.id ?? '');
		if (deleteRequest.error) {
			alert(deleteRequest.error.message);
		} else {
			onDeletion();
		}
		open = false;
	}
</script>

<Modal
	bind:open
	danger
	modalHeading={$t('delete-project', { projectName: project?.name ?? '' })}
	primaryButtonText={$t('generic.delete')}
	secondaryButtonText={$t('generic.cancel')}
	on:click:button--primary={deleteProject}
	on:click:button--secondary={() => (open = false)}
>
	<p>{$t('confirm.generic')}</p>
</Modal>
