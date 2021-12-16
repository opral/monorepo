<script lang="ts">
	import { LanguageCode } from '@inlang/common';
	import ISO6391 from 'iso-639-1';
	import { projectStore } from '$lib/stores/projectStore';

	import type { definitions } from '@inlang/database';
	import {
		Modal,
		Form,
		FormGroup,
		OutboundLink,
		Select,
		InlineNotification,
		NotificationActionButton,
		SelectItem
	} from 'carbon-components-svelte';
	import { database } from '$lib/services/database';
	import { page } from '$app/stores';
	import { autoCloseModalOnSuccessTimeout } from '$lib/utils/timeouts';

	export let open = false;

	let selectedLanguageIso: definitions['language']['iso_code'] | 'none' = 'none';

	let projectLanguages = $projectStore.data?.languages.map((language) => language.iso_code);

	// input must be iso 639-1 and not be contained in project langauges already

	$: isValidInput = ISO6391.validate(selectedLanguageIso);

	let availableLanguages = ISO6391.getAllCodes()
		.map((code) => ({
			code: code,
			name: ISO6391.getName(code)
		}))
		.filter((language) => projectLanguages?.includes(language.code as LanguageCode) === false);

	async function handleConfirm() {
		const create = await database.from<definitions['language']>('language').insert({
			iso_code: selectedLanguageIso as LanguageCode,
			project_id: $projectStore.data?.project.id
		});
		if (create.error) {
			alert(create.error);
		} else {
			projectStore.getData({ projectId: $page.params.projectId });
		}
		// automatically closing the modal but leave time to
		// let the user read the result status of the action
		setTimeout(() => {
			open = false;
		}, autoCloseModalOnSuccessTimeout);
	}
</script>

<Modal
	bind:open
	modalHeading="New language"
	primaryButtonText="Add"
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
			<Select labelText="Language" bind:selected={selectedLanguageIso}>
				<SelectItem value="none" text="Select a language" disabled hidden />
				{#each availableLanguages as language}
					<SelectItem value={language.code} text={`${language.name} - ${language.code}`} />
				{/each}
			</Select>
		</FormGroup>
		<InlineNotification hideCloseButton kind="info" subtitle="Looking for country codes?">
			<div slot="actions">
				<NotificationActionButton>
					<OutboundLink href="https://github.com/inlang/inlang/discussions/80">
						Upvote feature
					</OutboundLink>
				</NotificationActionButton>
			</div>
		</InlineNotification>

		<InlineNotification
			hideCloseButton
			kind="warning"
			subtitle="Keys are not machine translated for newly added languages."
		>
			<div slot="actions">
				<NotificationActionButton>
					<OutboundLink href="https://github.com/inlang/inlang/discussions/77">
						Upvote feature
					</OutboundLink>
				</NotificationActionButton>
			</div>
		</InlineNotification>
	</Form>
</Modal>
