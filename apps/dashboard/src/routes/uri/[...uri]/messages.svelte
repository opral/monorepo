<script lang="ts">
	import ISO6391 from 'iso-639-1';
	import ConfirmModal from '$lib/components/modals/ConfirmModal.svelte';
	import { Button, InlineNotification, Loading, Search } from 'carbon-components-svelte';
	import CreateMessageModal from '$lib/components/modals/CreateMessageModal.svelte';
	import Add16 from 'carbon-icons-svelte/lib/Add16';
	import { Attribute, Message, parsePattern, Pattern } from '@inlang/fluent-ast';
	import { LanguageCode, Result } from '@inlang/utils';
	import Patterns from '$lib/components/Patterns.svelte';
	import { lintPattern } from '@inlang/fluent-lint';
	// import CreateAttributeModal from '$lib/components/modals/CreateAttributeModal.svelte';
	import { t } from '$lib/services/i18n';
	import { resources, inlangConfig, searchParams } from '$lib/stores/routes/uriStores';
	import { writeResources } from '@inlang/core';
	import { fs } from '$lib/stores/filesystem';

	let searchQuery = '';

	let createMessageModal: CreateMessageModal;

	// let createAttributeModal: CreateAttributeModal;

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
		if ($resources === undefined) {
			return [];
		}
		const result: Row[] = [];
		const ids = $resources.getMessageIds({
			languageCode: $inlangConfig.baseLanguageCode
		});
		const filtered = [...(ids ?? [])].filter((id) =>
			id.toLowerCase().startsWith(searchQuery.toLowerCase())
		);
		for (const messageId of filtered) {
			// messages
			const messages = $resources.getMessageForAllResources({ id: messageId }) ?? {};
			// transforming record of messages to a record of patterns
			const patterns: Record<string, Pattern | undefined> = Object.fromEntries(
				Object.entries(messages).map(([languageCode, message]) => [
					languageCode as LanguageCode,
					message?.value ?? undefined
				])
			);
			const sourceLanguageCode = $inlangConfig.baseLanguageCode;
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
					$resources.getAttributeForAllResources({
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
		const sourceLanguageCode = $inlangConfig.baseLanguageCode;
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
			const message = $resources.getMessage({
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
					$resources.updateMessage({
						id: args.messageId,
						languageCode: languageCode as LanguageCode,
						with: message
					}) ?? Result.err();
			} else {
				updateOrCreateResult =
					$resources.createMessage({
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
		const result = await writeResources({
			fs: $fs,
			resources: $resources,
			directory: $searchParams.dir,
			...$inlangConfig
		});
		if (result.isErr) {
			alert(result.error);
		} else {
			fs.refresh();
		}
		// TODO
		// const databaseRequest = await projectStore.updateResourcesInDatabase();
		// if (databaseRequest.isErr) {
		// 	alert(databaseRequest.error);
		// }
	}

	// ugh ugly 2x
	async function saveAttributeChanges(args: {
		messageId: string;
		attributeId: string;
		serializedPatterns: Record<LanguageCode, string>;
	}): Promise<void> {
		for (const [languageCode, serializedPattern] of Object.entries(args.serializedPatterns)) {
			const attribute = $resources.getAttribute({
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
					$resources.updateAttribute({
						id: args.attributeId,
						messageId: args.messageId,
						languageCode: languageCode as LanguageCode,
						with: attribute
					}) ?? Result.err();
			} else {
				updateOrCreateResult =
					$resources.createAttribute({
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
		// TODO
		// const databaseRequest = await projectStore.updateResourcesInDatabase();
		// if (databaseRequest.isErr) {
		// 	alert(databaseRequest.error);
		// }
	}

	async function deleteMessage(args: { messageId: Message['id']['name'] }): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		const onConfirm = async () => {
			const deletion = $resources.deleteMessageForAllResources({
				id: args.messageId
			});
			if (deletion === undefined || deletion.isErr) {
				return Result.err(deletion?.error);
			}
			const write = await writeResources({
				fs: $fs,
				resources: $resources,
				directory: $searchParams.dir,
				...$inlangConfig
			});
			if (write.isErr) {
				alert(write.error);
			} else {
				fs.refresh();
			}
			return Result.ok(undefined);
		};
		const message = $resources.getMessage({
			id: args.messageId,
			languageCode: $inlangConfig.baseLanguageCode
		});
		if ((message?.attributes.length ?? []) > 0) {
			confirmModal.show({
				heading: $t('delete.message', { id: args.messageId }),
				danger: true,
				message: $t('warning.message-has-attributes'),
				requireTypingOf: $t('require-typing-attributes'),
				onConfirm
			});
		} else {
			confirmModal.show({
				heading: $t('delete.message', { id: args.messageId }),
				danger: true,
				message: '',
				onConfirm
			});
		}
	}

	async function deleteAttribute(args: {
		messageId: Message['id']['name'];
		attributeId: Attribute['id']['name'];
	}): Promise<void> {
		confirmModal.show({
			heading: $t('delete.attribute', { messageId: args.messageId, attributeId: args.attributeId }),
			message: $t('warning.irreversible-action'),
			danger: true,
			onConfirm: async () => {
				const deletion = $resources.deleteAttributeForAllResources({
					messageId: args.messageId,
					id: args.attributeId
				});
				if (deletion === undefined || deletion.isErr) {
					return Result.err(deletion?.error);
				}
				const write = await writeResources({
					fs: $fs,
					resources: $resources,
					directory: $searchParams.dir,
					...$inlangConfig
				});
				if (write.isErr) {
					alert(write.error);
				} else {
					fs.refresh();
				}
				return Result.ok(undefined);
			}
		});
	}
</script>

{#if $resources === undefined || $inlangConfig === undefined}
	<Loading />
{:else}
	<!-- description -->
	<h1 class="mb-1">{$t('generic.messages')}</h1>
	<!-- <p>{$t('info.messages')}</p> -->
	<br />
	<!-- "action bar" -->
	<row class="min-w-0">
		<Search bind:value={searchQuery} />
		<Button
			kind="secondary"
			icon={Add16}
			on:click={() => {
				// createAttributeModal.show();
			}}
		>
			{$t('new.attribute')}
		</Button>
		<Button
			icon={Add16}
			on:click={() => {
				createMessageModal.show();
			}}>{$t('new.message')}</Button
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
					baseLanguageCode={$inlangConfig.baseLanguageCode}
					onDelete={() => deleteMessage({ messageId: row.messageId })}
					onSaveChanges={(serializedPatterns) =>
						saveMessageChanges({ messageId: row.messageId, serializedPatterns })}
				>
					<InlineNotification
						slot="above-expanded"
						hideCloseButton={true}
						kind="info"
						title={$t('info.message-no-pattern')}
						subtitle={$t('info.message-no-pattern-fill-out', {
							baseLanguageCode: ISO6391.getName($inlangConfig.baseLanguageCode)
						})}
					/>
				</Patterns>
			{:else}
				<Patterns
					id={row.messageId}
					patterns={row.patterns}
					displayActionRequired={row.actionRequired}
					requiredLanguageCodes={$inlangConfig.languageCodes}
					baseLanguageCode={$inlangConfig.baseLanguageCode}
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
				requiredLanguageCodes={$inlangConfig.languageCodes}
				baseLanguageCode={$inlangConfig.baseLanguageCode}
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
	<!-- <CreateAttributeModal bind:this={createAttributeModal} /> -->

	<ConfirmModal bind:this={confirmModal} />
{/if}
