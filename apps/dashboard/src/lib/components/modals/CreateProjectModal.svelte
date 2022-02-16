<script lang="ts">
	import {
		Modal,
		Form,
		FormGroup,
		TextInput,
		MultiSelect,
		Loading,
		ProgressIndicator,
		ProgressStep,
		InlineNotification,
		NotificationActionButton
	} from 'carbon-components-svelte';
	import { database } from '$lib/services/database';
	import { DatabaseResponse } from '$lib/types/databaseResponse';
	import type { definitions } from '@inlang/database';
	import ISO6391 from 'iso-639-1';
	import SelectHumanLanguageTile from '../tiles/SelectHumanLanguageTile.svelte';
	import { auth } from '$lib/services/auth';
	import { isValidMessageId } from '@inlang/fluent-syntax';
	import { t } from '$lib/services/i18n';

	export function show(args: { onProjectCreated: () => unknown }): void {
		// automatically overwriting old data when show is called
		onProjectCreated = args.onProjectCreated;
		loadProjects();
		projectName = '';
		currentStep = 0;
		selectedLanguageCodes = [];
		selectedSourceLanguageCode = undefined;
		open = true;
		// nobody knows why it has to be in setTimeout
		setTimeout(() => {
			projectNameElement.focus();
		}, 50);
	}

	export function hide(): void {
		open = false;
	}

	let open = false;

	let onProjectCreated: () => unknown;

	// 0 = basics
	// 1 = human base language
	let currentStep: 0 | 1 = 0;

	let projectName = '';

	let projectNameElement: HTMLInputElement;

	// eslint-disable-next-line unicorn/no-null
	let projects: DatabaseResponse<definitions['project'][]> = { data: null, error: null };

	let selectedLanguageCodes: definitions['language']['code'][] = [];
	let confirmIsLoading = false;

	// the actual value (type definitions)
	let selectedSourceLanguageCode: definitions['language']['code'] | undefined;

	$: isValidInput =
		projectNameIsValidInput &&
		projectAlreadyExists === false &&
		selectedLanguageCodes.length > 0 &&
		sourceLanguageIsValidInput;

	$: sourceLanguageIsValidInput = selectedSourceLanguageCode
		? ISO6391.getAllCodes().includes(selectedSourceLanguageCode)
		: false;

	// using fluent message id to lint project names to be somewhat future proof
	// and dis-allow crazy project names
	$: projectNameIsValidInput = projectName !== '' && isValidMessageId(projectName);

	$: currentStepIsValid = () => {
		if (currentStep === 0) {
			return projectNameIsValidInput && selectedLanguageCodes.length > 0;
		} else if (currentStep === 1) {
			return sourceLanguageIsValidInput;
		}
		return false;
	};

	$: projectAlreadyExists = projects.data?.some((project) => project.name === projectName);

	// helper function
	function allLanguagesWithCode(): { id: string; text: string }[] {
		return ISO6391.getLanguages(ISO6391.getAllCodes()).map((language) => ({
			id: language.code,
			text: `${language.name} - ${language.code}`
		}));
	}

	async function loadProjects(): Promise<void> {
		projects = await database.from<definitions['project']>('project').select();

		if (projects.error) {
			alert(projects.error.message);
			console.error(projects.error);
		}
	}

	async function handleCreateProject(): Promise<void> {
		confirmIsLoading = true;

		const insertProject = await database
			.from<definitions['project']>('project')
			.insert({
				name: projectName,
				created_by_user_id: auth.user()?.id ?? '',
				base_language_code: selectedSourceLanguageCode
			})
			.single();
		if (insertProject.error) {
			console.error(insertProject.error);
			alert(insertProject.error.message);
		} else {
			const insertDefaultLanguage = await database
				.from<definitions['language']>('language')
				.insert({ code: selectedSourceLanguageCode, project_id: insertProject.data.id });
			if (insertDefaultLanguage.error) {
				alert(insertDefaultLanguage.error.message);
			}
			const insertOtherLanguages = await database.from<definitions['language']>('language').insert(
				selectedLanguageCodes
					.filter((language) => language !== selectedSourceLanguageCode)
					.map((iso) => ({
						code: iso,
						project_id: insertProject.data.id
					}))
			);
			if (insertOtherLanguages.error) {
				alert(insertOtherLanguages.error.message);
			}
		}
		onProjectCreated();
		confirmIsLoading = false;
		open = false;
	}
</script>

<Modal
	bind:open
	modalHeading={$t('new.project')}
	primaryButtonText={currentStep === 0 ? $t('generic.next') : $t('generic.create')}
	primaryButtonDisabled={currentStepIsValid() === false && isValidInput === false}
	hasForm={true}
	hasScrollingContent={selectedLanguageCodes.length > 5}
	secondaryButtonText={currentStep === 0 ? $t('generic.cancel') : $t('generic.back')}
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
						(projectNameIsValidInput && selectedLanguageCodes.length > 0) === false}
					label={$t('generic.basics')}
					on:click={() => (currentStep = 0)}
				/>
				<ProgressStep
					current={currentStep === 1}
					label="Human Base Language"
					on:click={() => (currentStep = 1)}
				/>
			</ProgressIndicator>
		</FormGroup>
		{#if currentStep === 0}
			<FormGroup>
				<TextInput
					labelText={$t('project-name')}
					bind:value={projectName}
					invalid={projectName !== '' && projectNameIsValidInput === false}
					invalidText={isValidMessageId(projectName) === false
						? $t('error.invalid-character')
						: $t('error.entity-already-exists', { entity: projectName })}
					placeholder={$t('name-of-project')}
					bind:ref={projectNameElement}
				/>
			</FormGroup>
			<FormGroup>
				<MultiSelect
					bind:selectedIds={selectedLanguageCodes}
					direction="top"
					titleText={$t('human-languages')}
					placeholder={selectedLanguageCodes.length === 0 ? $t('human-languages-question') : ''}
					filterable
					items={allLanguagesWithCode()}
				/>
				{#if selectedLanguageCodes.length > 0}
					<p class="pt-1">
						<!-- count:2 = to get plural -->
						{$t('generic.language', { count: '2' })}:
						{#each selectedLanguageCodes as isoCode, i}
							{#if i + 1 !== selectedLanguageCodes.length}
								{ISO6391.getName(isoCode) + ', '}
							{:else}
								{ISO6391.getName(isoCode)}
							{/if}
						{/each}
					</p>
				{/if}
			</FormGroup>
		{:else if currentStep === 1 && selectedLanguageCodes.length === 0}
			<InlineNotification
				kind="warning"
				title={$t('warning.one-language-is-required')}
				hideCloseButton
			>
				<div slot="actions">
					<NotificationActionButton on:click={() => (currentStep -= 1)}>
						{$t('go-back')}
					</NotificationActionButton>
				</div>
			</InlineNotification>
		{:else}
			<SelectHumanLanguageTile
				bind:selected={selectedSourceLanguageCode}
				possibleLanguageCodes={selectedLanguageCodes}
				legend={$t('select.human-base-language')}
			/>
			<p class="pt-4">
				{$t('definition.base-language')}
			</p>
		{/if}
	</Form>
</Modal>
