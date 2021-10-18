<script lang="ts">
	import { Modal, Form, FormGroup, TextInput, Select, SelectItem } from 'carbon-components-svelte';
	import { database } from '$lib/services/database';
	import { DatabaseResponse } from '$lib/types/databaseResponse';
	import type { definitions } from '@inlang/database';
	import { onMount } from 'svelte';
	import ISO6391 from 'iso-639-1';
	import { createEventDispatcher } from 'svelte';

	export let open = false;

	export let heading: string;

	let projectName = '';

	let organizationId: definitions['organization']['id'] | undefined = undefined;

	// each time the organiations update, select the first organizations id
	$: organizationId = organizations.data?.[0].id;

	let dispatch = createEventDispatcher();

	let organizations: DatabaseResponse<definitions['organization'][]> = { data: null, error: null };
	let languageIso: definitions['language']['iso_code'] = 'en';

	// input must be iso 639-1 and not be contained in project langauges already
	$: languageIsValidInput = ISO6391.validate(languageIso);
	$: projectNameIsValidInput = projectName !== '';

	$: organizationIdIsValidInput = organizationId !== null || organizationId !== '';

	// load the projects of the selected organization
	onMount(async () => {
		organizations = await database.from<definitions['organization']>('organization').select();
		if (organizations.error) {
			alert(organizations.error.message);
		}
	});

	async function handleConfirm() {
		if (organizationId === null || organizationIdIsValidInput === false) {
			alert('The chosen organization is not valid.');
			return;
		}
		const create = await database
			.from<definitions['project']>('project')
			.insert({
				name: projectName,
				organization_id: organizationId,
				default_iso_code: languageIso
			})
			.single();
		if (create.error) {
			console.error(create.error);
			alert(create.error.message);
		} else {
			const insertDefaultLanguage = await database
				.from<definitions['language']>('language')
				.insert({ iso_code: languageIso, project_id: create.data.id });
			if (insertDefaultLanguage.error) {
				alert(insertDefaultLanguage.error.message);
			}
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
	primaryButtonDisabled={(languageIsValidInput &&
		projectNameIsValidInput &&
		organizationIdIsValidInput) === false}
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
			<TextInput
				labelText="Project name"
				bind:value={projectName}
				invalid={projectNameIsValidInput === false}
				invalidText="This field is required."
			/>
		</FormGroup>

		<FormGroup>
			<Select
				labelText="In which organization do you want to create the project? "
				bind:selected={organizationId}
			>
				<SelectItem disabled hidden value="organization name" text="Choose an option" />
				{#if organizations}
					{#each organizations.data || [] as organization}
						<SelectItem value={organization.id} text={organization.name} />
					{/each}
				{/if}
			</Select>
		</FormGroup>
		<TextInput
			labelText="In which language are you developing your app?"
			bind:value={languageIso}
			invalid={languageIsValidInput === false}
			invalidText={'The code must be an ISO 639-1 code.'}
		/>
	</Form>
</Modal>
