<script lang="ts">
	import {
		Modal,
		Form,
		FormGroup,
		TextInput,
		Select,
		SelectItem,
		MultiSelect,
		Loading
	} from 'carbon-components-svelte';
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

	let dispatch = createEventDispatcher();

	let organizations: DatabaseResponse<definitions['organization'][]> = { data: null, error: null };
	let selectedDefaultLanguageIso: definitions['language']['iso_code'] = 'en';
	let selectedLanguageIsoCodes: definitions['language']['iso_code'][] = [];
	let confirmIsLoading = false;

	$: isValidInput =
		projectNameIsValidInput && organizationIdIsValidInput && selectedLanguageIsoCodes.length > 0;

	$: projectNameIsValidInput = projectName !== '';

	$: organizationIdIsValidInput = organizationId !== null || organizationId !== '';

	// load the projects of the selected organization
	onMount(async () => {
		organizations = await database.from<definitions['organization']>('organization').select();
		if (organizations.error) {
			alert(organizations.error.message);
		} else {
			// ---- ugly workaorund which requires a proper solution long term ----
			// naively choosing the first org id on mount since the select
			// does not bind the organization id the first time (bug?).
			// But in 99% of the cases, the first organization is shown in the select.
			organizationId = organizations.data?.[0].id;
		}
	});

	async function handleConfirm() {
		confirmIsLoading = true;
		if (organizationId === undefined || organizationIdIsValidInput === false) {
			alert('The chosen organization is not valid.');
			return;
		}
		const insertProject = await database
			.from<definitions['project']>('project')
			.insert({
				name: projectName,
				organization_id: organizationId,
				default_iso_code: selectedDefaultLanguageIso
			})
			.single();
		if (insertProject.error) {
			console.error(insertProject.error);
			alert(insertProject.error.message);
		} else {
			const insertDefaultLanguage = await database
				.from<definitions['language']>('language')
				.insert({ iso_code: selectedDefaultLanguageIso, project_id: insertProject.data.id });
			if (insertDefaultLanguage.error) {
				alert(insertDefaultLanguage.error.message);
			}
			const insertOtherLanguages = await database.from<definitions['language']>('language').insert(
				selectedLanguageIsoCodes
					.filter((language) => language !== selectedDefaultLanguageIso)
					.map((iso) => ({
						iso_code: iso,
						project_id: insertProject.data.id
					}))
			);
			if (insertOtherLanguages.error) {
				alert(insertOtherLanguages.error.message);
			}
		}
		dispatch('updateProjects');
		confirmIsLoading = false;
		open = false;
	}
</script>

<!-- {console.log(rows_organizations())} -->
<Modal
	bind:open
	modalHeading={heading}
	primaryButtonText="Create"
	primaryButtonDisabled={isValidInput === false}
	hasForm={true}
	secondaryButtonText="Cancel"
	on:click:button--primary={handleConfirm}
	on:click:button--secondary={() => (open = false)}
	on:open
	on:close
	on:submit
>
	{#if confirmIsLoading}
		<Loading />
	{/if}
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
		<FormGroup>
			<Select
				labelText="Human language used in source code:"
				bind:selected={selectedDefaultLanguageIso}
			>
				{#each ISO6391.getLanguages(ISO6391.getAllCodes()) as possibleLanguage}
					<SelectItem
						value={possibleLanguage.code}
						text={`${possibleLanguage.code} - ${possibleLanguage.name}`}
					/>
				{/each}
			</Select>
		</FormGroup>
		<FormGroup>
			<MultiSelect
				bind:selectedIds={selectedLanguageIsoCodes}
				direction="top"
				titleText="In which languages do you want to translate your app?"
				filterable
				invalid={selectedLanguageIsoCodes.length === 0}
				invalidText="Select at least one language..."
				items={ISO6391.getLanguages(ISO6391.getAllCodes()).map((language) => ({
					id: language.code,
					text: `${language.code} - ${language.name}`
				}))}
			/>
			<p>
				Languages selected:
				{#each selectedLanguageIsoCodes as isoCode}
					{ISO6391.getName(isoCode) + ' '}
				{/each}
			</p>
		</FormGroup>
	</Form>
</Modal>
