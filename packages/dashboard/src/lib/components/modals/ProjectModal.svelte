<script lang="ts">
	import { Modal, Form, FormGroup, TextInput, Checkbox } from 'carbon-components-svelte';
	import { database } from '$lib/services/database';
	import { DatabaseResponse } from '$lib/types/databaseResponse';
	import type { definitions } from '@inlang/database';
	import { projectStore } from '$lib/stores/projectStore';
	import { page } from '$app/stores';

	export let open = false;
	export let primaryButtonDisabled = false;

	export let heading = 'Add project';

	export let projectName: string | '' = '';
	export let organizationId: string | '' = '';

	async function handleConfirm() {
		const create = await database
			.from<definitions['project']>('project')
			.insert({ name: projectName, organization_id: organizationId });
		if (create.error) {
			alert(create.error);
		} else {
			projectStore.getData({ projectId: $page.params.projectId });
		}
		// automatically closing the modal but leave time to
		// let the user read the result status of the action
		setTimeout(() => {
			open = false;
		}, 1000);
	}
</script>

<Modal
	bind:open
	modalHeading={heading}
	primaryButtonText="Create"
	hasForm={true}
	secondaryButtonText="Cancel"
	on:click:button--primary={handleConfirm}
	on:click:button--secondary={() => (open = false)}
	on:open
	on:close
	on:submit
>
	<Form>
		<FormGroup>
			<TextInput labelText="Project name" bind:value={projectName} />
		</FormGroup>
		<!-- <FormGroup>
			<TextInput
				labelText="In which organization do you want to put the project? "
				bind:value={organizationName}
			/>
		</FormGroup> -->
		<FormGroup disabled>
			<TextInput labelText="some other information" />
		</FormGroup>
		<Checkbox labelText="checkbox" />
	</Form>
</Modal>
