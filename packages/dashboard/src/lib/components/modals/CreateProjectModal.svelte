<script lang="ts">
	import {
		Modal,
		Form,
		FormGroup,
		TextInput,
		MultiSelect,
		Loading,
		ComboBox,
		ProgressIndicator,
		ProgressStep,
		RadioTile,
		TileGroup,
		InlineNotification,
		NotificationActionButton
	} from 'carbon-components-svelte';
	import { database } from '$lib/services/database';
	import { DatabaseResponse } from '$lib/types/databaseResponse';
	import type { definitions } from '@inlang/database';
	import { onMount } from 'svelte';
	import ISO6391 from 'iso-639-1';
	import { createEventDispatcher } from 'svelte';
	import { isEqual } from 'lodash';

	export let open = false;

	// 0 = basics
	// 1 = default human language
	let currentStep: 0 | 1 = 0;

	$: if (currentStep === 0 || currentStep === 1) {
		console.log({ currentStep });
	}

	let projectName = '';

	let projectNameElement: HTMLInputElement;

	let dispatch = createEventDispatcher();

	let organizations: DatabaseResponse<definitions['organization'][]> = { data: null, error: null };

	let projects: DatabaseResponse<definitions['project'][]> = { data: null, error: null };

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

	// the actual value (type definitions)
	let selectedDefaultLanguageIso: definitions['language']['iso_code'] | undefined;

	$: isValidInput =
		projectNameIsValidInput &&
		organizationIdIsValidInput &&
		selectedLanguageIsoCodes.length > 0 &&
		defaultLanguageIsValidInput;

	$: defaultLanguageIsValidInput = selectedDefaultLanguageIso
		? ISO6391.getAllCodes().includes(selectedDefaultLanguageIso)
		: false;

	$: projectNameIsValidInput = projectName !== '';

	$: organizationIdIsValidInput =
		organizations.data?.map((organization) => organization.id).includes(organizationId ?? '') ??
		false;

	$: currentStepIsValid = () => {
		if (currentStep === 0) {
			return (
				projectNameIsValidInput &&
				organizationIdIsValidInput &&
				selectedLanguageIsoCodes.length > 0 &&
				projectAlreadyExistsForOrganization() === false
			);
		} else if (currentStep === 1) {
			return defaultLanguageIsValidInput;
		}
		return false;
	};

	// helper function
	function allLanguagesWithCode() {
		return ISO6391.getLanguages(ISO6391.getAllCodes()).map((language) => ({
			id: language.code,
			text: `${language.name} - ${language.code}`
		}));
	}

	$: projectAlreadyExistsForOrganization = () => {
		if (organizations.data && projects.data && selectedOrganizationIndex !== -1 && projectName) {
			return projects.data
				?.map((project) => ({ organizationId: project.organization_id, name: project.name }))
				.some((project) =>
					isEqual(project, {
						organizationId: organizations.data?.[selectedOrganizationIndex].id,
						name: projectName
					})
				);
		}
		return false;
	};

	// load the projects of the selected organization
	onMount(async () => {
		organizations = await database.from<definitions['organization']>('organization').select();
		projects = await database.from<definitions['project']>('project').select();
		if (organizations.error) {
			alert(organizations.error.message);
			console.error(organizations.error);
		}
		if (projects.error) {
			alert(projects.error.message);
			console.error(projects.error);
		}
	});

	async function handleCreateProject() {
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

	onMount(() => {
		projectNameElement.focus();
	});
</script>

<Modal
	bind:open
	modalHeading="New project"
	primaryButtonText={currentStep === 0 ? 'Next' : 'Create'}
	primaryButtonDisabled={currentStepIsValid() === false && isValidInput === false}
	hasForm={true}
	hasScrollingContent={selectedLanguageIsoCodes.length > 5}
	secondaryButtonText={currentStep === 0 ? 'Cancel' : 'Back'}
	on:click:button--primary={currentStep === 0 ? () => (currentStep += 1) : handleCreateProject}
	on:click:button--secondary={currentStep === 0 ? () => (open = false) : () => (currentStep -= 1)}
	on:open
	on:close
	on:submit
>
	{#if confirmIsLoading}
		<Loading />
	{/if}
	<Form>
		<FormGroup>
			<ProgressIndicator spaceEqually>
				<ProgressStep
					current={currentStep === 0}
					complete={projectNameIsValidInput}
					invalid={currentStep > 0 &&
						(projectNameIsValidInput &&
							organizationIdIsValidInput &&
							selectedLanguageIsoCodes.length > 0) === false &&
						projectAlreadyExistsForOrganization() === false}
					label="Basics"
					description="The progress indicator will listen for clicks on the steps"
					on:click={() => (currentStep = 0)}
				/>
				<ProgressStep
					current={currentStep === 1}
					label="Default Human Language"
					description="The progress indicator will listen for clicks on the steps"
					on:click={() => (currentStep = 1)}
				/>
			</ProgressIndicator>
		</FormGroup>
		{#if currentStep === 0}
			<FormGroup>
				<TextInput
					labelText="Project name"
					bind:value={projectName}
					invalid={projectAlreadyExistsForOrganization()}
					invalidText={`${projectName} already exists for the organization.`}
					placeholder="What is the name of the project?"
					bind:ref={projectNameElement}
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
				<MultiSelect
					bind:selectedIds={selectedLanguageIsoCodes}
					direction="top"
					titleText="Human languages"
					placeholder={selectedLanguageIsoCodes.length === 0
						? 'In which languages (English, German ...) do you want to offer your software?'
						: ''}
					filterable
					items={allLanguagesWithCode()}
				/>
				{#if selectedLanguageIsoCodes.length > 0}
					<p class="pt-1">
						Languages:
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
		{:else if currentStep === 1}
			<FormGroup>
				<TileGroup
					bind:selected={selectedDefaultLanguageIso}
					legend="Select default human language"
				>
					{#if selectedLanguageIsoCodes.length === 0}
						<InlineNotification
							kind="warning"
							title="You need to select at least one human language for the project."
							hideCloseButton
						>
							<div slot="actions">
								<NotificationActionButton on:click={() => (currentStep -= 1)}>
									Go back
								</NotificationActionButton>
							</div>
						</InlineNotification>
					{:else}
						{#each selectedLanguageIsoCodes as languageCode}
							<RadioTile light value={languageCode}>
								{ISO6391.getName(languageCode)} - {languageCode}
							</RadioTile>
						{/each}
					{/if}
				</TileGroup>
				<p class="pt-4">
					The default human language is the language used during development. In most cases it's
					English.
				</p>
			</FormGroup>
		{/if}
	</Form>
</Modal>
