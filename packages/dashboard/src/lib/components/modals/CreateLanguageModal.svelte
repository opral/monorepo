<script lang="ts">
	import ISO6391 from 'iso-639-1';
	import { projectStore } from '$lib/stores/projectStore';

	import type { definitions } from '@inlang/database';
	import { Modal, Form, FormGroup, TextInput } from 'carbon-components-svelte';
	import { database } from '$lib/services/database';
	import { page } from '$app/stores';

	export let open = false;

	let languageIso: definitions['language']['iso_code'];

	$: languageExistsInProject = $projectStore.data?.languages
		.map((language) => language.iso_code)
		.includes(languageIso);

	// input must be iso 639-1 and not be contained in project langauges already
	$: isValidInput = ISO6391.validate(languageIso);

	async function handleConfirm() {
		const create = await database
			.from<definitions['language']>('language')
			.insert({ iso_code: languageIso, project_id: $projectStore.data?.project.id });
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
	modalHeading="Add new language"
	primaryButtonText="Create"
	hasForm={true}
	primaryButtonDisabled={isValidInput === false}
	secondaryButtonText="Cancel"
	on:click:button--primary={handleConfirm}
	on:click:button--secondary={() => (open = false)}
	on:close
	on:submit
>
	<Form>
		<FormGroup>
			<TextInput
				labelText="language code (ISO 639-1)"
				bind:value={languageIso}
				invalid={isValidInput === false || languageExistsInProject}
				invalidText={languageExistsInProject
					? 'Language already exists in this project.'
					: 'The code must be an ISO 639-1 code.'}
			/>
		</FormGroup>
		<FormGroup disabled>
			<TextInput labelText="country code (ISO 3166-1 alpha-2)" placeholder="coming soon..." />
		</FormGroup>
	</Form>
</Modal>
