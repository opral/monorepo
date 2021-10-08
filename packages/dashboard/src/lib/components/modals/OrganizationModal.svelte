<script lang="ts">
	import { Modal, Form, FormGroup, TextInput, Checkbox } from 'carbon-components-svelte';
	import { auth } from '$lib/services/auth';

	import { projectStore } from '$lib/stores/projectStore';

	import type { definitions } from '@inlang/database';
	import { database } from '$lib/services/database';
	import { DatabaseResponse } from '$lib/types/databaseResponse';
	import { page } from '$app/stores';
	import { createEventDispatcher } from 'svelte';

	export let open = false;

	let organizations: DatabaseResponse<definitions['organization'][]>;

	export let heading = 'Add organization';

	export let organizationName: string | '' = '';

	let dispatch = createEventDispatcher();

	async function handleConfirm() {
		console.log(organizationName);
		console.log(auth.user()?.id);
		const create = await database
			.from<definitions['organization']>('organization')
			.insert({ name: organizationName, created_by_user_id: auth.user()?.id });
		if (create.error) {
			alert(create.error.message);
			console.log('create error');
		}
		// automatically closing the modal but leave time to
		// let the user read the result status of the action
		setTimeout(() => {
			dispatch('updateOrganizations');
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
			<TextInput labelText="Organization name" bind:value={organizationName} />
		</FormGroup>
		<!-- <FormGroup disabled>
			<TextInput labelText="some other information" />
		</FormGroup>
		<Checkbox labelText="checkbox" /> -->
	</Form>
</Modal>
