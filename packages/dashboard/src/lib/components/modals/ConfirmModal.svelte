<script lang="ts" context="module">
	// can be imported by other files and helps to stay consistent throughout the app
	export const defaultConfirmModalText = {
		delete: {
			organization: {
				heading: 'Delete organization',
				message:
					'Do you really want to delete this organization? All projects and their translations will be deleted.'
			},
			project: {
				heading: 'Delete project',
				message:
					'Do you really want to delete this project? All translation will be deleted from inlang. Your local files (in the code) will not be deleted.'
			}
		}
	} as const;
</script>

<script lang="ts">
	import { InlineLoading, Link, Modal, TextInput } from 'carbon-components-svelte';
	import type { InlineLoadingProps } from 'carbon-components-svelte/types/InlineLoading/InlineLoading';
	import { Result } from '@inlang/common/src/types/result';
	import { brombTriggerLink } from '$lib/services/bromb';

	/**
	 * @param heading Header of the modal
	 * @param danger If true, the confirm button will be red
	 * @param requireTypingOf when defined, the user must enter the string before being able to proceed.
	 * @param onConfirm is a promise to show loading indicators and returns a result to either show success or an error
	 */
	export function show(args: {
		heading: string;
		message: string;
		danger: boolean;
		requireTypingOf?: string;
		onConfirm: () => Promise<Result<void, Error>>;
	}): void {
		status = 'inactive';
		heading = args.heading;
		message = args.message;
		danger = args.danger;
		requireTypingOf = args.requireTypingOf;
		nameOfEntityInput = '';
		onConfirm = args.onConfirm;
		open = true;
	}

	export function hide(): void {
		open = false;
	}

	let danger = false;

	let onConfirm: () => Promise<Result<void, Error>>;

	$: primaryButtonDisabled =
		status === 'active' || status === 'finished'
			? true
			: requireTypingOf
			? nameOfEntityInput !== requireTypingOf
			: false;

	let requireTypingOf: string | undefined;

	let open = false;

	let heading: string;

	let nameOfEntityInput = '';

	let message: string;

	let status: InlineLoadingProps['status'] = 'inactive';

	async function handleConfirm() {
		status = 'active';
		const result = (
			await Promise.all([
				onConfirm(),
				// for nicer ux, wait at least x milliseconds
				new Promise((resolve) => setTimeout(resolve, 500))
			])
		)[0]; // take the first element of the promise chain -> `onConfirm`
		if (result.isErr) {
			status = 'error';
			return;
		}
		status = 'finished';
		// automatically closing the modal but leave time to
		// let the user read the result status of the action
		setTimeout(() => {
			open = false;
		}, 1000);
	}
</script>

<!-- Set Default Language Modal -->
<Modal
	bind:danger
	bind:open
	modalHeading={heading}
	primaryButtonText={status !== 'error' ? 'Confirm' : 'Try again'}
	{primaryButtonDisabled}
	secondaryButtonText="Cancel"
	on:click:button--primary={handleConfirm}
	on:click:button--secondary={() => {
		open = false;
	}}
>
	<p>{message}</p>
	<br />
	{#if requireTypingOf}
		<p class="pb-1">Please type <b>{requireTypingOf}</b> to confirm.</p>
		<TextInput bind:value={nameOfEntityInput} />
		<br />
	{/if}
	{#if status === 'active'}
		<InlineLoading status="active" description="Working on it..." />
	{:else if status === 'error'}
		<row class="items-center space-x-1">
			<InlineLoading status="error" description="An error occurred." class="w-auto" />
			<Link href={brombTriggerLink({ category: 'bug' })} class="text-xs">Report as bug</Link>
		</row>
	{:else if status === 'finished'}
		<InlineLoading status="finished" description="Success" />
	{/if}
</Modal>
