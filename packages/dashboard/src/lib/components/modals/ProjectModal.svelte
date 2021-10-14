<script lang="ts">
	import { Modal, Form, FormGroup, TextInput } from 'carbon-components-svelte';
	import { database } from '$lib/services/database';
	import { DatabaseResponse } from '$lib/types/databaseResponse';
	import type { definitions } from '@inlang/database';
	import { onMount } from 'svelte';
	import ISO6391 from 'iso-639-1';
	import { createEventDispatcher } from 'svelte';

	export let open = false;
	//export let primaryButtonDisabled = false;
	let isLoading = false;

	export let heading = 'Add project';

	export let projectName: string | '' = '';
	export let organizationId: string | '' = '';
	//export let iso_code: string | '' = '';

	let dispatch = createEventDispatcher();

	let organizations: DatabaseResponse<definitions['organization'][]>;
	let languageIso: definitions['language']['iso_code'];

	function makeApiKey(length: number) {
		var result = '';
		var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-';
		var charactersLength = characters.length;
		for (var i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	}

	// input must be iso 639-1 and not be contained in project langauges already
	$: isValidInput = ISO6391.validate(languageIso);

	// load the projects of the selected organization
	onMount(async () => {
		organizations = await database.from<definitions['organization']>('organization').select();

		if (organizations.error) {
			alert(organizations.error);
		}
		isLoading = false;
	});

	async function handleConfirm() {
		console.log(organizationId);
		console.log(projectName);
		const create = await database.from<definitions['project']>('project').insert({
			api_key: makeApiKey(40), //randomstring.generate(40),
			name: projectName,
			organization_id: organizationId,
			default_iso_code: languageIso
		});
		if (create.error) {
			alert(create.error);
			console.log(create.error);
		}
		// automatically closing the modal but leave time to
		// let the user read the result status of the action
		setTimeout(() => {
			open = false;
			dispatch('updateProjects');
		}, 1000);
	}
</script>

<!-- {console.log(rows_organizations())} -->
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

		<FormGroup>
			<!-- <Select
				labelText="In which organization do you want to put the project? "
				bind:value={organizationId}
			>
				<SelectItem disabled hidden value="organization name" text="Choose an option" />
				{#if organizations}
					{#each organizations.data || [] as organization}
						<SelectItem value={organization.id} text={organization.name} />
					{/each}
				{/if}
			</Select> -->
			<select bind:value={organizationId}>
				{#if organizations}
					{#each organizations.data || [] as organization}
						<option value={organization.id}>
							{organization.name}
						</option>
					{/each}
				{/if}
			</select>
		</FormGroup>
		<TextInput
			labelText="language code (ISO 639-1)"
			bind:value={languageIso}
			invalid={isValidInput === false}
			invalidText={'The code must be an ISO 639-1 code.'}
		/>

		<!-- <FormGroup disabled>
			<TextInput labelText="some other information" />
		</FormGroup>
		<Checkbox labelText="checkbox" /> -->
	</Form>
</Modal>
