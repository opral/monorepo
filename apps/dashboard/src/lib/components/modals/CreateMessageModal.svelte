<script lang="ts">
	import ISO6391 from 'iso-639-1';
	import { Modal, TextArea, TextInput } from 'carbon-components-svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import { page } from '$app/stores';
	import { autoCloseModalOnSuccessTimeout } from '$lib/utils/timeouts';
	import { isValidMessageId } from '@inlang/fluent-syntax';
	import InlineLoadingWrapper from '../InlineLoadingWrapper.svelte';
	import { t } from '$lib/services/i18n';

	let open = false;

	export function show(): void {
		messageId = '';
		messagePattern = '';
		status = 'inactive';
		open = true;
		// only god knows why focus has to be wrapped in a setTimeout to work
		setTimeout(() => {
			keyNameInputElement.focus();
		});
	}

	let messageId = '';

	let messagePattern = '';

	let status: InlineLoadingWrapper['$$prop_def']['status'] = 'inactive';

	$: isValidInput = messageId !== '' && isValidMessageId(messageId) && messagePattern != '';

	let invalidMessageIdErrorMessage: () => string;
	$: invalidMessageIdErrorMessage = () => {
		if (
			$projectStore.data?.resources.messageExist({
				id: messageId,
				languageCode: $projectStore.data.project.base_language_code
			})
		) {
			return $t('error.id-exists');
		} else if (messageId.includes('.')) {
			return $t('error.message-cant-contain-dot');
		}
		return $t('error.id-invalid-character');
	};

	let keyNameInputElement: HTMLInputElement;

	async function handleSubmission(): Promise<void> {
		status = 'active';
		if ($projectStore.data === null) {
			console.log('Projectstore.data was null');
			status = 'error';
			return;
		}
		const create = $projectStore.data.resources.createMessage({
			id: messageId,
			pattern: messagePattern,
			languageCode: $projectStore.data.project.base_language_code
		});
		const updateDatabase = await projectStore.updateResourcesInDatabase();
		if (create.isErr || updateDatabase.isErr) {
			alert(
				create.isErr
					? create.error
					: updateDatabase.isErr
					? updateDatabase.error
					: $t('error.unknown')
			);
			status = 'error';
		} else {
			status = 'finished';
			projectStore.getData({ projectId: $page.params.projectId });
			// automatically closing the modal but leave time to
			// let the user read the result status of the action
			setTimeout(() => {
				open = false;
			}, autoCloseModalOnSuccessTimeout);
		}
	}
</script>

<Modal
	bind:open
	modalHeading={$t('new.message')}
	size="sm"
	primaryButtonText={$t('generic.create')}
	secondaryButtonText={$t('generic.cancel')}
	on:click:button--secondary={() => {
		open = false;
	}}
	on:submit={handleSubmission}
	preventCloseOnClickOutside
	primaryButtonDisabled={isValidInput === false}
	shouldSubmitOnEnter={false}
>
	<p>
		{@html $t('info.new-message-base-language', {
			baseLanguageCode: ISO6391.getName($projectStore.data?.project.base_language_code ?? '')
		})}
		}
	</p>
	<br />
	<!-- 
		bug: keyNameIsValid is not showing once the user enters a duplicativ key, but works for the primary button (wtf?) 
	   	not of importance to fix for now.
	-->
	<TextInput
		invalid={messageId !== '' && isValidMessageId(messageId) === false && status !== 'finished'}
		invalidText={invalidMessageIdErrorMessage()}
		labelText="Id"
		bind:value={messageId}
		bind:ref={keyNameInputElement}
	/>
	<br />
	<TextArea
		rows={2}
		labelText={`Pattern`}
		bind:value={messagePattern}
		helperText={$t('info.new-pattern-base-language', {
			baseLanguageCode: ISO6391.getName($projectStore.data?.project.base_language_code ?? '')
		})}
	/>
	<!-- <br />
	<TextArea
		rows={3}
		labelText="Description"
		bind:value={description}
		placeholder="What is this key for?"
	/>
	<br /> -->
	<br />
	{#if status !== 'inactive'}
		<InlineLoadingWrapper
			{status}
			activeDescription={$t('loading.creating-message')}
			finishedDescription={$t('loading.message-created')}
		/>
	{/if}
</Modal>
