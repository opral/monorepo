<script lang="ts">
	import type { CreateBaseTranslationRequestBody } from './../../../routes/api/internal/create-base-translation';
	import { InlineLoading, Modal, TextArea } from 'carbon-components-svelte';
	import type { definitions } from '@inlang/database';
	import { projectStore } from '$lib/stores/projectStore';
	import { page } from '$app/stores';

	export let open: boolean;
	export let keyName: definitions['key']['name'];

	let baseTranslationText: definitions['translation']['text'] = '';

	let status: 'idle' | 'isLoading' | 'isFinished' | 'hasError' = 'idle';

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
				status = 'idle';
			}, 1500);
		}
	}
</script>

<Modal
	bind:open
	modalHeading="Create base translation for {keyName}"
	size="sm"
	primaryButtonText="Create"
	secondaryButtonText="Cancel"
	on:click:button--secondary={() => {
		open = false;
	}}
	on:submit={handleSubmission}
	preventCloseOnClickOutside
	shouldSubmitOnEnter={false}
>
	<p class="text-gray-500">
		The base translation is the default text that is shown and must match your projects default
		language ({$projectStore.data?.project.default_iso_code}).
	</p>
	<br />
	<TextArea
		labelText="Base translation:"
		bind:value={baseTranslationText}
		placeholder="Enter the base translation..."
	/>
	{#if status === 'isLoading'}
		<InlineLoading status="active" description="Auto-translating..." />
	{:else if status === 'isFinished'}
		<InlineLoading status="finished" description="Translations have been created." />
	{:else if status === 'hasError'}
		<InlineLoading status="error" description="Something went wrong please report the issue." />
	{/if}
</Modal>
