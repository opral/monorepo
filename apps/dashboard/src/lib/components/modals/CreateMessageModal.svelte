<script lang="ts">
	import ISO6391 from 'iso-639-1';
	import { InlineLoading, Modal, Tag, TextArea, TextInput } from 'carbon-components-svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import { page } from '$app/stores';
	import type { CreateBaseTranslationRequestBody } from './../../../routes/api/internal/create-base-translation';
	import { autoCloseModalOnSuccessTimeout } from '$lib/utils/timeouts';
	import { isValidMessageId } from '@inlang/fluent-syntax';

	let open = false;

	export function show(): void {
		messageId = '';
		messageValue = '';
		status = 'idle';
		open = true;
		// only god knows why focus has to be wrapped in a setTimeout to work
		setTimeout(() => {
			keyNameInputElement.focus();
		});
	}

	let messageId = '';

	let messageValue = '';

	let status: 'idle' | 'isLoading' | 'isFinished' | 'hasError' = 'idle';

	$: isValidInput = messageId !== undefined && isValidMessageId(messageId) && messageValue !== '';

	$: invalidMessageIdErrorMessage = $projectStore.data?.resources.doesMessageExist({
		id: messageId,
		languageCode: $projectStore.data.project.default_iso_code
	})
		? 'Id already exists.'
		: 'Invalid character.';

	let keyNameInputElement: HTMLInputElement;

	async function handleSubmission(): Promise<void> {
		status = 'isLoading';
		if ($projectStore.data === null) {
			throw 'Project Store is null.';
		}
		const body: CreateBaseTranslationRequestBody = {
			projectId: $projectStore.data.project.id,
			baseTranslation: {
				key_name: messageId,
				text: messageValue
			}
		};
		const response = await fetch('/api/internal/create-base-translation', {
			method: 'post',
			headers: new Headers({
				'content-type': 'application/json'
			}),
			body: JSON.stringify(body)
		});
		if (response.ok !== true) {
			status = 'hasError';
		} else {
			status = 'isFinished';
			projectStore.getData({ projectId: $page.params.projectId });
			// automatically closing the modal but leave time to
			// let the user read the result status of the action
			setTimeout(() => {
				open = false;
			}, autoCloseModalOnSuccessTimeout);
		}
	}
</script>

<Modal
	bind:open
	modalHeading="New message"
	size="sm"
	primaryButtonText="Create"
	secondaryButtonText="Cancel"
	on:click:button--secondary={() => {
		open = false;
	}}
	on:submit={handleSubmission}
	preventCloseOnClickOutside
	primaryButtonDisabled={isValidInput === false}
	shouldSubmitOnEnter={false}
>
	<p>
		A new message is always created for the human base language first. The human base language for
		this project is <strong>
			{ISO6391.getName($projectStore.data?.project.default_iso_code ?? '')}
		</strong>.
	</p>
	<br />
	<!-- 
		bug: keyNameIsValid is not showing once the user enters a duplicativ key, but works for the primary button (wtf?) 
	   	not of importance to fix for now.
	-->
	<TextInput
		invalid={messageId !== undefined &&
			isValidMessageId(messageId) === false &&
			status !== 'isFinished'}
		invalidText={invalidMessageIdErrorMessage}
		labelText="Id (identifier)"
		bind:value={messageId}
		bind:ref={keyNameInputElement}
	/>
	<br />
	<TextArea
		rows={2}
		labelText={`Message`}
		bind:value={messageValue}
		helperText={`Remember, the message must be written in ${ISO6391.getName(
			$projectStore.data?.project.default_iso_code ?? ''
		)}.`}
	/>
	<!-- <br />
	<TextArea
		rows={3}
		labelText="Description"
		bind:value={description}
		placeholder="What is this key for?"
	/>
	<br /> -->
	<br />
	{#if status === 'isLoading'}
		<InlineLoading status="active" description="Auto-translating..." />
	{:else if status === 'isFinished'}
		<InlineLoading status="finished" description="Translations have been created." />
	{:else if status === 'hasError'}
		<InlineLoading status="error" description="Something went wrong please report the issue." />
	{/if}
</Modal>
