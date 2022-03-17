<script lang="ts">
	import ISO6391 from 'iso-639-1';
	import { Modal, TextArea, TextInput } from 'carbon-components-svelte';
	import { autoCloseModalOnSuccessTimeout } from '$lib/utils/timeouts';
	import { isValidMessageId } from '@inlang/fluent-ast';
	import InlineLoadingWrapper from '../InlineLoadingWrapper.svelte';
	import { t } from '$lib/services/i18n';
	import { inlangConfig, resources } from '$lib/stores/routes/uriStores';

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
			$resources.messageExist({
				id: messageId,
				languageCode: $inlangConfig.baseLanguageCode
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

		const create = $resources.createMessage({
			id: messageId,
			pattern: messagePattern,
			languageCode: $inlangConfig.baseLanguageCode
		});
		resources.triggerUpdate();
		if (create.isErr) {
			alert(create.isErr ? create.error : $t('error.unknown'));
			status = 'error';
		} else {
			status = 'finished';
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
			baseLanguageCode: ISO6391.getName($inlangConfig.baseLanguageCode)
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
			baseLanguageCode: ISO6391.getName($inlangConfig.baseLanguageCode)
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
