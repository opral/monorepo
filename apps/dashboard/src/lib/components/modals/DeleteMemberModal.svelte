<script lang="ts">
	import { Modal } from 'carbon-components-svelte';
	import { database } from '$lib/services/database';
	import type { definitions } from '@inlang/database';

	export function show(args: {
		user: definitions['user'];
		organization: definitions['organization'];
		onUserDeleted: () => void;
	}): void {
		user = args.user;
		organization = args.organization;
		onUserDeleted = args.onUserDeleted;
		open = true;
	}

	export function hide(): void {
		open = false;
	}

	let onUserDeleted: () => void;
	let user: definitions['user'] | undefined;
	let organization: definitions['organization'] | undefined;
	let open = false;

	async function deleteMember(): Promise<void> {
		if (organization === undefined || user === undefined) {
			if (organization === undefined) {
				console.log('organization is undefined');
			}
			if (user === undefined) {
				console.log('user is undefined');
			}
			return;
		}
		const deleteRequest = await database
			.from<definitions['member']>('member')
			.delete()
			.eq('organization_id', organization?.id)
			.eq('user_id', user?.id);
		if (deleteRequest.error) {
			alert(deleteRequest.error.message);
		} else {
			onUserDeleted();
		}
		open = false;
	}
</script>

<Modal
	bind:open
	danger
	modalHeading={`Remove ${user?.email} from ${organization?.name}`}
	primaryButtonText="Remove"
	secondaryButtonText="Cancel"
	on:click:button--primary={deleteMember}
	on:click:button--secondary={() => (open = false)}
>
	<p>Are you sure? This is a permanent action and cannot be undone.</p>
</Modal>
