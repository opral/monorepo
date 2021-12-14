<script lang="ts">
	import type { definitions } from '@inlang/database';
	import { database } from '$lib/services/database';

	import { FormGroup, Modal, TextInput } from 'carbon-components-svelte';
	import InlineLoadingWrapper from '../InlineLoadingWrapper.svelte';
	import { userStore } from '$lib/stores/userStore';
	import { withUxTimeout } from '$lib/utils/withUxTimeout';
	import { autoCloseModalOnSuccessTimeout } from '$lib/utils/timeouts';

	export function show(args: { onOrganizationCreated: () => unknown }): void {
		nameInput = '';
		onOrganizationCreated = args.onOrganizationCreated;
		inlineLoadingStatus = 'inactive';
		open = true;
		// only god knows why focus has to be wrapped in a setTimeout to work
		setTimeout(() => {
			nameInputElement.focus();
		});
	}

	let onOrganizationCreated: () => unknown;

	let open = false;

	let nameInput: string;

	let inlineLoadingStatus: InlineLoadingWrapper['$$prop_def']['status'] = 'inactive';

	$: isValidInput = nameInput?.includes(' ') === false && nameInput?.length > 0;

	let nameInputElement: HTMLInputElement;

	async function handleSubmission() {
		inlineLoadingStatus = 'active';
		const insert = await withUxTimeout(async () =>
			database
				.from<definitions['organization']>('organization')
				.insert({ created_by_user_id: $userStore.data?.id, name: nameInput })
		);
		if (insert.error) {
			console.error(insert.error.message);
			inlineLoadingStatus = 'error';
		} else {
			inlineLoadingStatus = 'finished';
			setTimeout(() => (open = false), autoCloseModalOnSuccessTimeout);
			onOrganizationCreated();
		}
	}
</script>

<Modal
	bind:open
	modalHeading="New organization"
	size="sm"
	primaryButtonText={inlineLoadingStatus !== 'error' ? 'Create' : 'Try again'}
	secondaryButtonText="Cancel"
	on:click:button--secondary={() => {
		open = false;
	}}
	on:submit={handleSubmission}
	primaryButtonDisabled={isValidInput === false ||
		inlineLoadingStatus === 'active' ||
		inlineLoadingStatus === 'finished'}
	shouldSubmitOnEnter={false}
>
	<p>Create an organization to manage different projects.</p>
	<br />
	<FormGroup>
		<TextInput
			invalid={nameInput?.includes(' ')}
			invalidText="The organization name can not contain whitespace."
			labelText="Organization Name"
			placeholder="What's the name of the organization?"
			bind:value={nameInput}
			bind:ref={nameInputElement}
		/>
	</FormGroup>
	{#if inlineLoadingStatus !== 'inactive'}
		<InlineLoadingWrapper
			status={inlineLoadingStatus}
			activeDescription="Creating organization..."
			finishedDescription="Organization created."
		/>
	{/if}
</Modal>
