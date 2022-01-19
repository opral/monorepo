<script lang="ts">
	import ISO6391 from 'iso-639-1';
	import ConfirmModal from '$lib/components/modals/ConfirmModal.svelte';
	import { Button, InlineNotification, Search } from 'carbon-components-svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import CreateMessageModal from '$lib/components/modals/CreateMessageModal.svelte';
	import Add16 from 'carbon-icons-svelte/lib/Add16';
	import { Attribute, Message, parsePattern, Pattern } from '@inlang/fluent-syntax';
	import { LanguageCode, Result } from '@inlang/common';
	import Patterns from '$lib/components/Patterns.svelte';
	import { lintPattern } from '@inlang/fluent-lint';
	import CreateAttributeModal from '$lib/components/modals/CreateAttributeModal.svelte';

	let searchQuery = '';

	let createMessageModal: CreateMessageModal;

	let createAttributeModal: CreateAttributeModal;

	let confirmModal: ConfirmModal;

	type AttributeRow = {
		messageId: string;
		attributeId: string;
		type: Attribute['type'];
		sourceAttribute: Attribute;
		patterns: Record<LanguageCode, Pattern | undefined>;
		actionRequired: boolean;
	};

	type MessageRow = {
		messageId: string;
		type: Message['type'];
		// a message can have no pattern
		sourceMessage: Message;
		patterns: Record<LanguageCode, Pattern | undefined>;
		actionRequired: boolean;
	};

	type Row = MessageRow | AttributeRow;

	let rows: () => Row[];
	$: rows = () => {
		const result: Row[] = [];
		const ids = $projectStore.data?.resources.getMessageIds({
			languageCode: $projectStore.data.project.base_language_code
		});
		const filtered = [...(ids ?? [])].filter((id) =>
			id.toLowerCase().startsWith(searchQuery.toLowerCase())
		);
		for (const messageId of filtered) {
			// messages
			const messages =
				$projectStore.data?.resources.getMessageForAllResources({ id: messageId }) ?? {};
			// transforming record of messages to a record of patterns
			const patterns: Record<string, Pattern | undefined> = Object.fromEntries(
				Object.entries(messages).map(([languageCode, message]) => [
					languageCode as LanguageCode,
					message?.value ?? undefined
				])
			);
			const sourceLanguageCode = $projectStore.data?.project.base_language_code ?? 'en';
			const sourceMessage = messages[sourceLanguageCode];
			if (sourceMessage === undefined) {
				alert(`Error 219dx: The source message is undefined for id "${messageId}"`);
				return result;
			}
			result.push({
				messageId,
				sourceMessage: sourceMessage,
				patterns,
				actionRequired: isActionRequired({ messagesOrAttributes: messages }),
				type: 'Message'
			});
			// attributes
			for (const attribute of sourceMessage.attributes) {
				const attributes =
					$projectStore.data?.resources.getAttributeForAllResources({
						messageId,
						id: attribute.id.name
					}) ?? {};
				const patterns: Record<string, Pattern | undefined> = Object.fromEntries(
					Object.entries(attributes).map(([languageCode, attribute]) => [
						languageCode as LanguageCode,
						attribute?.value ?? undefined
					])
				);
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const sourceAttribute = attributes[sourceLanguageCode]!;
				result.push({
					messageId,
					attributeId: attribute.id.name,
					sourceAttribute: sourceAttribute,
					patterns,
					actionRequired: isActionRequired({ messagesOrAttributes: attributes }),
					type: 'Attribute'
				});
			}
		}
		return result;
	};

	/**
	 * Determines whether or not the message or attribute requires action.
	 */
	function isActionRequired(args: {
		messagesOrAttributes: Record<LanguageCode, Message | Attribute | undefined>;
	}): boolean {
		const sourceLanguageCode = $projectStore.data?.resources.baseLanguageCode ?? 'en';
		const sourceEntity = args.messagesOrAttributes[sourceLanguageCode];
		if (sourceEntity === undefined || sourceEntity?.value === null) {
			return true;
		}
		for (const [languageCode, entity] of Object.entries(args.messagesOrAttributes)) {
			if (languageCode === sourceLanguageCode) {
				continue;
			}
			if (entity?.value) {
				const lint = lintPattern({ source: sourceEntity.value, target: entity.value });
				if (lint.isErr) {
					return true;
				}
			} else {
				return true;
			}
		}
		return false;
	}

	// ugh that's so ugly
	async function saveMessageChanges(args: {
		messageId: string;
		serializedPatterns: Record<LanguageCode, string>;
	}): Promise<void> {
		for (const [languageCode, serializedPattern] of Object.entries(args.serializedPatterns)) {
			const message = $projectStore.data?.resources.getMessage({
				id: args.messageId,
				languageCode: languageCode as LanguageCode
			});
			let updateOrCreateResult: Result<void, Error>;
			if (message !== undefined) {
				// parse the pattern
				const parsedPattern = parsePattern(serializedPattern);
				if (parsedPattern.isErr) {
					alert(parsedPattern.error);
					return;
				}
				// update the message pattern
				message.value = parsedPattern.value;
				updateOrCreateResult =
					$projectStore.data?.resources.updateMessage({
						id: args.messageId,
						languageCode: languageCode as LanguageCode,
						with: message
					}) ?? Result.err();
			} else {
				updateOrCreateResult =
					$projectStore.data?.resources.createMessage({
						id: args.messageId,
						languageCode: languageCode as LanguageCode,
						pattern: serializedPattern
					}) ?? Result.err();
			}

			if (updateOrCreateResult.isErr) {
				alert(updateOrCreateResult.error);
				return;
			}
		}
		const databaseRequest = await projectStore.updateResourcesInDatabase();
		if (databaseRequest.isErr) {
			alert(databaseRequest.error);
		}
	}

	// ugh ugly 2x
	async function saveAttributeChanges(args: {
		messageId: string;
		attributeId: string;
		serializedPatterns: Record<LanguageCode, string>;
	}): Promise<void> {
		for (const [languageCode, serializedPattern] of Object.entries(args.serializedPatterns)) {
			const attribute = $projectStore.data?.resources.getAttribute({
				id: args.attributeId,
				messageId: args.messageId,
				languageCode: languageCode as LanguageCode
			});
			let updateOrCreateResult: Result<void, Error>;
			if (attribute !== undefined) {
				// parse the pattern
				const parsedPattern = parsePattern(serializedPattern);
				if (parsedPattern.isErr) {
					alert(parsedPattern.error);
					return;
				}
				attribute.value = parsedPattern.value;
				updateOrCreateResult =
					$projectStore.data?.resources.updateAttribute({
						id: args.attributeId,
						messageId: args.messageId,
						languageCode: languageCode as LanguageCode,
						with: attribute
					}) ?? Result.err();
			} else {
				updateOrCreateResult =
					$projectStore.data?.resources.createAttribute({
						id: args.attributeId,
						messageId: args.messageId,
						languageCode: languageCode as LanguageCode,
						pattern: serializedPattern
					}) ?? Result.err();
			}
			if (updateOrCreateResult.isErr) {
				alert(updateOrCreateResult.error);
				return;
			}
		}
		const databaseRequest = await projectStore.updateResourcesInDatabase();
		if (databaseRequest.isErr) {
			alert(databaseRequest.error);
		}
	}

	async function deleteMessage(args: { messageId: Message['id']['name'] }): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		const onConfirm = async () => {
			const deletion = $projectStore.data?.resources.deleteMessageForAllResources({
				id: args.messageId
			});
			if (deletion === undefined || deletion.isErr) {
				return Result.err(deletion?.error);
			}
			return projectStore.updateResourcesInDatabase();
		};
		const message = $projectStore.data?.resources.getMessage({
			id: args.messageId,
			languageCode: $projectStore.data.project.base_language_code
		});
		if ((message?.attributes.length ?? []) > 0) {
			confirmModal.show({
				heading: `Delete message "${args.messageId}"?`,
				danger: true,
				message: `This message has attributes. All attributes will be deleted as well.`,
				requireTypingOf: 'delete attributes',
				onConfirm
			});
		} else {
			confirmModal.show({
				heading: `Delete message "${args.messageId}"?`,
				danger: true,
				message: `This action is irreversible.`,
				onConfirm
			});
		}
	}

	async function deleteAttribute(args: {
		messageId: Message['id']['name'];
		attributeId: Attribute['id']['name'];
	}): Promise<void> {
		confirmModal.show({
			heading: `Delete attribute "${args.messageId} . ${args.attributeId}"?`,
			message: `This action is irreversible.`,
			danger: true,
			onConfirm: async () => {
				const deletion = $projectStore.data?.resources.deleteAttributeForAllResources({
					messageId: args.messageId,
					id: args.attributeId
				});
				if (deletion === undefined || deletion.isErr) {
					return Result.err(deletion?.error);
				}
				return projectStore.updateResourcesInDatabase();
			}
		});
	}
</script>

<!-- description -->
<h1 class="mb-1">Messages</h1>
<p>All your messages will appear here. You can create, delete and edit them.</p>
<br />
<!-- "action bar" -->
<row class="min-w-0">
	<Search bind:value={searchQuery} />
	<Button
		kind="secondary"
		icon={Add16}
		on:click={() => {
			createAttributeModal.show();
		}}
	>
		New attribute
	</Button>
	<Button
		icon={Add16}
		on:click={() => {
			createMessageModal.show();
		}}>New message</Button
	>
</row>
<!-- divider -->
<row class="bg-gray-300 w-full h-12 items-center">
	<strong class="pl-12">Id</strong>
</row>
<!-- patterns -->
{#each rows() as row, i}
	<!-- of messages -->
	{#if row.type === 'Message'}
		<!-- a message with no patterns -->
		{#if Object.values(row.patterns).every((pattern) => pattern === undefined)}
			<Patterns
				id={row.messageId}
				patterns={{ en: new Pattern([]) }}
				displayActionRequired={false}
				requiredLanguageCodes={[]}
				baseLanguageCode={$projectStore.data?.project.base_language_code ?? 'en'}
				onDelete={() => deleteMessage({ messageId: row.messageId })}
				onSaveChanges={(serializedPatterns) =>
					saveMessageChanges({ messageId: row.messageId, serializedPatterns })}
			>
				<InlineNotification
					slot="above-expanded"
					hideCloseButton={true}
					kind="info"
					title="This message has no patterns but attributes:"
					subtitle={`If you want to add patterns to this message, fill out the ${ISO6391.getName(
						$projectStore.data?.project.base_language_code ?? ''
					)} pattern and press 'Save changes'.`}
				/>
			</Patterns>
		{:else}
			<Patterns
				id={row.messageId}
				patterns={row.patterns}
				displayActionRequired={row.actionRequired}
				requiredLanguageCodes={$projectStore.data?.languages.map((language) => language.code) ?? []}
				baseLanguageCode={$projectStore.data?.project.base_language_code ?? 'en'}
				onDelete={() => deleteMessage({ messageId: row.messageId })}
				onSaveChanges={(serializedPatterns) =>
					saveMessageChanges({ messageId: row.messageId, serializedPatterns })}
			/>
		{/if}
	{:else}
		<!-- of attributes -->
		<Patterns
			id={row.messageId + ' . ' + row.attributeId}
			patterns={row.patterns}
			displayActionRequired={row.actionRequired}
			requiredLanguageCodes={$projectStore.data?.languages.map((language) => language.code) ?? []}
			baseLanguageCode={$projectStore.data?.project.base_language_code ?? 'en'}
			onDelete={() => deleteAttribute({ messageId: row.messageId, attributeId: row.attributeId })}
			onSaveChanges={(serializedPatterns) =>
				saveAttributeChanges({
					messageId: row.messageId,
					attributeId: row.attributeId,
					serializedPatterns
				})}
		/>
	{/if}
	{#if i + 1 < rows().length}
		<div class="h-px w-full bg-gray-300" />
	{/if}
{/each}

<!-- modals -->
<CreateMessageModal bind:this={createMessageModal} />

<CreateAttributeModal bind:this={createAttributeModal} />

<ConfirmModal bind:this={confirmModal} />
