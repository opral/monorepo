<script lang="ts">
	import { Modal, TextArea, TextInput } from 'carbon-components-svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import { database } from '$lib/services/database';
	import { page } from '$app/stores';
	import { createEventDispatcher } from 'svelte';
	import type { definitions } from '@inlang/database';

	export let open = false;

	let keyName: definitions['key']['name'];
	let description: definitions['key']['description'];

	const dispatch = createEventDispatcher();

	$: isValidInput = () => {
		if (keyName === '') {
			inputInvalidMessage = 'The key field is required.';
			return false;
		} else if ($projectStore.data?.keys.map((key) => key.name).includes(keyName)) {
			inputInvalidMessage = 'The key already exists in the project.';
			return false;
		}
		return true;
	};

	let inputInvalidMessage: string;

	async function save() {
		const insert = await database
			.from<definitions['key']>('key')
			.insert({ project_id: $page.path.split('/')[2], name: keyName, description: description });
		if (insert.error) {
			alert(insert.error.message);
		} else {
			projectStore.getData({ projectId: $page.params.projectId });
			/*let newRow = {
				id: largestTableId + 1,
				database_id: insert.data[0].id,
				key: key,
				description: description,
				translations: []
			};*/
			dispatch('createKey', keyName);
		}
	}
</script>

<Modal
	bind:open
	modalHeading="Create key"
	size="sm"
	primaryButtonText="Create"
	secondaryButtonText="Cancel"
	on:click:button--secondary={() => {
		open = false;
	}}
	on:submit={() => {
		open = false;
		save();
	}}
	preventCloseOnClickOutside
	hasScrollingContent
	primaryButtonDisabled={isValidInput() === false}
	shouldSubmitOnEnter={false}
>
	<!-- 
		bug: isValidInput is not showing once the user enters a duplicativ key, but works for the primary button (wtf?) 
	   	not of importance to fix for now.
	-->
	<TextInput
		invalid={isValidInput() === false}
		invalidText={inputInvalidMessage}
		labelText="Key"
		bind:value={keyName}
		placeholder="example.hello"
	/>
	<br />
	<TextArea labelText="Description" bind:value={description} placeholder="What is this key for?" />
</Modal>
