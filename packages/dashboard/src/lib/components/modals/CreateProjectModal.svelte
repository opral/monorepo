<script lang="ts">
	import { LanguageCode } from '@inlang/common/src/types/languageCode';
	import {
		Modal,
		Form,
		FormGroup,
		TextInput,
		MultiSelect,
		Loading,
		ComboBox
	} from 'carbon-components-svelte';
	import { database } from '$lib/services/database';
	import { DatabaseResponse } from '$lib/types/databaseResponse';
	import type { definitions } from '@inlang/database';
	import { onMount } from 'svelte';
	import ISO6391 from 'iso-639-1';
	import { createEventDispatcher } from 'svelte';

	export let open = false;

	let projectName = '';

	let dispatch = createEventDispatcher();

	let organizations: DatabaseResponse<definitions['organization'][]> = { data: null, error: null };
	let selectedLanguageIsoCodes: definitions['language']['iso_code'][] = [];
	let confirmIsLoading = false;
	// the selected index of the ComboBox
	let selectedOrganizationIndex = -1;
	// the actual value (type definitions)
	let organizationId: definitions['organization']['id'] | undefined = undefined;
	// which is reactively deducted
	$: organizationId =
		selectedOrganizationIndex === -1
			? undefined
			: organizations.data?.[selectedOrganizationIndex].id;
	// the selected index of the ComboBox
	let selectedDefaultLanguageIsoIndex = -1;
	// the actual value (type definitions)
	let selectedDefaultLanguageIso: definitions['language']['iso_code'] | undefined;
	// which is reactively deducted
	$: selectedDefaultLanguageIso =
		selectedDefaultLanguageIsoIndex === -1
			? undefined
			: (allLanguagesWithCode()[selectedDefaultLanguageIsoIndex].id as LanguageCode);

	$: isValidInput =
		projectNameIsValidInput && organizationIdIsValidInput && selectedLanguageIsoCodes.length > 0;

	$: projectNameIsValidInput = projectName !== '';

	$: organizationIdIsValidInput = organizationId !== null || organizationId !== '';

	// helper function
	function allLanguagesWithCode() {
		return ISO6391.getLanguages(ISO6391.getAllCodes()).map((language) => ({
			id: language.code,
			text: `${language.name} - ${language.code}`
		}));
	}

	// load the projects of the selected organization
	onMount(async () => {
		organizations = await database.from<definitions['organization']>('organization').select();
		if (organizations.error) {
			alert(organizations.error.message);
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

<Modal
	bind:open
	modalHeading="New project"
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
				placeholder="What's the name of the project?"
				bind:value={projectName}
			/>
		</FormGroup>

		<FormGroup>
			<ComboBox
				titleText="Organization"
				placeholder="To which organization does the project belong to?"
				bind:selectedIndex={selectedOrganizationIndex}
				items={organizations.data?.map((organization) => ({
					id: organization.id,
					text: organization.name
				}))}
				shouldFilterItem={(item, value) => {
					if (!value) return true;
					return item.text.toLowerCase().includes(value.toLowerCase());
				}}
			/>
		</FormGroup>
		<FormGroup>
			<ComboBox
				titleText="Default human language"
				placeholder="Which human language (English, German ...) is used during development?"
				direction="top"
				bind:selectedIndex={selectedDefaultLanguageIsoIndex}
				items={allLanguagesWithCode()}
				shouldFilterItem={(item, value) => {
					if (!value) return true;
					return item.text.toLowerCase().includes(value.toLowerCase());
				}}
			/>
		</FormGroup>
		<FormGroup>
			<MultiSelect
				bind:selectedIds={selectedLanguageIsoCodes}
				direction="top"
				titleText="Translated human languages"
				placeholder="Which additional human languages should your app support?"
				filterable
				items={allLanguagesWithCode().filter(
					(language) => language.id !== selectedDefaultLanguageIso
				)}
			/>
			{#if selectedLanguageIsoCodes.length > 0}
				<p class="pt-1">
					Translated languages:
					{#each selectedLanguageIsoCodes as isoCode, i}
						{#if i + 1 !== selectedLanguageIsoCodes.length}
							{ISO6391.getName(isoCode) + ', '}
						{:else}
							{ISO6391.getName(isoCode)}
						{/if}
					{/each}
				</p>
			{/if}
		</FormGroup>
	</Form>
</Modal>
