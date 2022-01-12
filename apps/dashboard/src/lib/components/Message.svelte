<script lang="ts">
	import PatternEditor from './fluent/PatternEditor.svelte';
	import ISO6391 from 'iso-639-1';
	import { brombTriggerLink } from '$lib/services/bromb';

	import { LanguageCode } from '@inlang/common';
	import { Message, parseEntry, serializeEntry } from '@inlang/fluent-syntax';
	import {
		Button,
		ButtonSet,
		ClickableTile,
		InlineNotification,
		NotificationActionButton,
		Tag,
		Tile
	} from 'carbon-components-svelte';
	import ChevronDown20 from 'carbon-icons-svelte/lib/ChevronDown20';
	import ChevronUp20 from 'carbon-icons-svelte/lib/ChevronUp20';
	import TrashCan20 from 'carbon-icons-svelte/lib/TrashCan20';
	import Bot20 from 'carbon-icons-svelte/lib/Bot20';
	import Save20 from 'carbon-icons-svelte/lib/Save20';
	import { isEqual } from 'lodash-es';
	import ConfirmModal from './modals/ConfirmModal.svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import { Result } from '@inlang/common';

	/**
	 * The (existent) messages.
	 */
	export let messages: Record<LanguageCode, Message | undefined>;

	/**
	 * The language codes for which patterns must exist.
	 *
	 * Is used to determine missing patterns (translations).
	 */
	export let requiredLanguageCodes: LanguageCode[];

	/**
	 * The base language code.
	 *
	 * Is used to derive the "source of truth".
	 */
	export let sourceLanguageCode: LanguageCode;

	$: sourceMessage = messages[sourceLanguageCode] as Message;

	/**
	 * All messages in serialized form without id.
	 *
	 */
	function deriveSerializedMessagesWithoutId(
		messages: Record<LanguageCode, Message | undefined>
	): Record<LanguageCode, string> {
		return Object.fromEntries(
			Object.entries(messages).map(([languageCode, message]) => [
				languageCode,
				message ? serializeEntry(message, { withoutId: true }) : ''
			])
		) as Record<LanguageCode, string>;
	}

	async function saveChanges(): Promise<void> {
		for (const [languageCode, message] of Object.entries(serializedMessagesWithoutId)) {
			const parsed = parseEntry(`${sourceMessage.id.name} = ${message}`, {
				expectType: 'Message'
			});
			if (parsed.isErr) {
				alert(parsed.error);
				return;
			}
			const update = $projectStore.data?.resources.updateMessage(
				{
					id: sourceMessage.id.name,
					languageCode: languageCode as LanguageCode,
					with: parsed.value
				},
				{ upsert: true }
			);
			if (update?.isErr) {
				alert(update.error);
				return;
			}
			console.log(
				$projectStore.data?.resources.getMessage({
					id: sourceMessage.id.name,
					languageCode: languageCode as LanguageCode
				})
			);
		}
		const databaseRequest = await projectStore.updateResourcesInDatabase();
		if (databaseRequest.isErr) {
			alert(databaseRequest.error);
		}
	}

	/**
	 * Internal (component scoped) representation of messages in serialized form.
	 *
	 * Necessary to avoid reactivity/mutability bugs caused by directly binding
	 * the input fields.
	 *
	 *
	 */
	let serializedMessagesWithoutId = deriveSerializedMessagesWithoutId(messages);

	let expanded = false;

	let confirmModal: ConfirmModal;

	/**
	 * whether the user made changes to any message
	 */
	$: hasChanges =
		isEqual(deriveSerializedMessagesWithoutId(messages), serializedMessagesWithoutId) === false;

	// update the internal represenation of messages if the external representation differs.
	// (in other words: has been updated)
	$: if (isEqual(deriveSerializedMessagesWithoutId(messages), serializedMessagesWithoutId)) {
		serializedMessagesWithoutId = deriveSerializedMessagesWithoutId(messages);
	}
</script>

<div>
	{#if sourceMessage === undefined}
		<InlineNotification
			hideCloseButton
			title={'Likely the message with id "' +
				Object.values(messages).find((message) => message?.id.name !== undefined)?.id.name +
				'":'}
			subtitle={`An error occured. The message is undefined for the base language ${ISO6391.getName(
				sourceLanguageCode
			)}.`}
		>
			<div slot="actions">
				<a href={brombTriggerLink({ category: 'bug' })}>
					<NotificationActionButton>Report the error</NotificationActionButton>
				</a>
			</div></InlineNotification
		>
	{:else}
		<ClickableTile on:click={() => (expanded = !expanded)}>
			<row class="justify-between items-center">
				<row class="space-x-3 items-center">
					{#if expanded}
						<ChevronUp20 />
					{:else}
						<ChevronDown20 />
					{/if}
					<p>{sourceMessage.id.name}</p>
				</row>
				<Tag type="red">Action required</Tag>
			</row>
		</ClickableTile>
		{#if expanded}
			<Tile>
				<grid class="grid-cols-4 gap-2">
					{#each requiredLanguageCodes as languageCode}
						<row class="col-span-1 space-x-2 items-center">
							<Tag type={languageCode === sourceLanguageCode ? 'green' : 'blue'}>
								{languageCode}
							</Tag>
							<p class="text-sm">{ISO6391.getName(languageCode)}</p>
						</row>
						<PatternEditor
							class="col-span-3"
							bind:serializedPattern={serializedMessagesWithoutId[languageCode]}
							serializedSourcePattern={serializedMessagesWithoutId[sourceLanguageCode]}
						/>
					{/each}
				</grid>
				<br />
				<br />
				<!-- actions -->
				<row class="justify-between">
					<ButtonSet>
						<Button
							kind="primary"
							size="field"
							disabled={hasChanges === false}
							icon={Save20}
							on:click={saveChanges}
						>
							Save changes
						</Button>
						<Button kind="secondary" size="field" disabled icon={Bot20}>Auto translate</Button>
					</ButtonSet>
					<Button
						kind="danger-tertiary"
						size="field"
						icon={TrashCan20}
						iconDescription="Delete"
						on:click={() => {
							confirmModal.show({
								heading: `Delete message "${sourceMessage?.id.name}"?`,
								danger: true,
								message: `This action is irreversible.`,
								onConfirm: async () => {
									const deletion = $projectStore.data?.resources.deleteMessageForAllResources({
										id: sourceMessage.id.name
									});
									if (deletion === undefined || deletion.isErr) {
										return Result.err(deletion?.error);
									}
									return projectStore.updateResourcesInDatabase();
								}
							});
						}}
					/>
				</row>
			</Tile>
		{/if}
	{/if}
</div>

<!-- modals -->
<ConfirmModal bind:this={confirmModal} />
