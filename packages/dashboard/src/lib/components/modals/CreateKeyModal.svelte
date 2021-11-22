<script lang="ts">
	import ISO6391 from 'iso-639-1';
	import { InlineLoading, Modal, TextArea, TextInput } from 'carbon-components-svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import { page } from '$app/stores';
	import type { CreateBaseTranslationRequestBody } from './../../../routes/api/internal/create-base-translation';

	let open = false;

	export function show(): void {
		keyName = '';
		baseTranslationText = '';
		open = true;
		// only god knows why focus has to be wrapped in a setTimeout to work
		setTimeout(() => {
			keyNameInputElement.focus();
		});
	}

	let keyName: string;

	//let description: definitions['key']['description'];

	let baseTranslationText = '';

	let status: 'idle' | 'isLoading' | 'isFinished' | 'hasError' = 'idle';

	$: keyNameIsValid = () => {
		const allKeys = $projectStore.data?.translations.getAllKeys();
		if (allKeys?.isErr) {
			alert(allKeys.error.message);
		} else if (allKeys?.value.some((key) => key === keyName)) {
			invalidKeyNameMessage = 'The key already exists in the project.';
			return false;
		}
		return true;
	};

	$: isValidInput = keyNameIsValid() && baseTranslationText !== '';

	let invalidKeyNameMessage: string;

	let keyNameInputElement: HTMLInputElement;

	async function handleSubmission() {
		status = 'isLoading';
		if ($projectStore.data === null) {
			throw 'Project Store is null.';
		}
		const body: CreateBaseTranslationRequestBody = {
			projectId: $projectStore.data.project.id,
			baseTranslation: {
				key_name: keyName,
				text: baseTranslationText
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
				// animation is ongoing after closing the modal.
				// thus another setTimeout to reset the status
				// ----- yes, very ugly ------
				setTimeout(() => {
					status = 'idle';
				}, 500);
			}, 1500);
		}
	}
</script>

<Modal
	bind:open
	modalHeading="New key"
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
	<!-- 
		bug: keyNameIsValid is not showing once the user enters a duplicativ key, but works for the primary button (wtf?) 
	   	not of importance to fix for now.
	-->
	<TextInput
		invalid={keyNameIsValid() === false && status !== 'isFinished'}
		invalidText={invalidKeyNameMessage}
		labelText="Key"
		helperText="A key acts as identifier for a translation."
		bind:value={keyName}
		bind:ref={keyNameInputElement}
	/>
	<br />
	<TextArea
		rows={2}
		labelText={`Base translation (${ISO6391.getName(
			$projectStore.data?.project.default_iso_code ?? ''
		)})`}
		bind:value={baseTranslationText}
		helperText={`The base translation is the text of the projects default (human) language.`}
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
