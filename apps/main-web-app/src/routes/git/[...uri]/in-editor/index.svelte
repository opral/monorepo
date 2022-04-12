<script lang="ts">
	import type { Attribute, Message } from '@inlang/fluent-ast';
	import { inlangConfig, resources } from '../_store';
	import Node from './_Node.svelte';

	$: baseLanguageCode = $inlangConfig?.baseLanguageCode ?? 'en';

	$: languageCodes = Object.keys($resources ?? {});

	/** all ids of all resources */
	$: messageIds = Array.from(
		// eslint-disable-next-line unicorn/no-array-reduce
		languageCodes.reduce((result, languageCode) => {
			return new Set([...result, ...($resources[languageCode]?.includedMessageIds() ?? [])]);
		}, new Set<string>())
	);

	/**
	 * Mapping the messages from the AST's with language codes.
	 *
	 * Values in the array are either a Message, or an Attribute.
	 */
	$: rows = () => {
		const result: (
			| {
					attributeId: string;
					messageId: string;
					baseNode: Attribute;
					nodes: Record<string, Attribute | undefined>;
					actionRequired: boolean;
			  }
			| {
					messageId: string;
					baseNode: Message;
					nodes: Record<string, Message | undefined>;
					actionRequired: boolean;
			  }
		)[] = [];
		for (const messageId of messageIds) {
			const messages = Object.fromEntries(
				languageCodes.map((languageCode) => [
					languageCode,
					$resources[languageCode]?.getMessage({ id: messageId })
				])
			);
			// pushing the message itself
			result.push({
				messageId: messageId,
				// assumption that the baseNode always exists
				baseNode: messages[baseLanguageCode] as Message,
				nodes: messages,
				actionRequired: Object.values(messages).some((message) => !message?.value)
			});
			const attributeIds = Array.from(
				// eslint-disable-next-line unicorn/no-array-reduce
				languageCodes.reduce((result, languageCode) => {
					return new Set([
						...result,
						...(messages[languageCode]?.attributes.map((attribute) => attribute.id.name) ?? [])
					]);
				}, new Set<string>())
			);
			// pushing all attributes of the message
			for (const attributeId of attributeIds) {
				const attributes = Object.fromEntries(
					languageCodes.map((languageCode) => [
						languageCode,
						messages[languageCode]?.attributes.find(
							(attribute) => attribute.id.name === attributeId
						)
					])
				);
				result.push({
					attributeId: attributeId,
					messageId: messageId,
					// assumption that the baseNode always exists
					baseNode: attributes[baseLanguageCode] as Attribute,
					nodes: attributes,
					actionRequired: Object.values(attributes).some((attribute) => !attribute?.value)
				});
			}
		}
		return result;
	};
</script>

<!-- <Menubar /> -->
<div class="grid grid-cols-4">
	<!-- <Sidebar class="col-span-1" /> -->
	<div class="col-span-4 flex flex-col space-y-2">
		{#if rows().some((row) => row.actionRequired)}
			<sl-alert open variant="danger">
				<sl-icon slot="icon" name="info-circle" />
				<div class="flex items-center">
					<div class="w-full">
						<h3 class="title-md">The project contains missing translations.</h3>
					</div>
				</div>
			</sl-alert>
		{/if}
		{#each rows() as row}
			<Node {row} {baseLanguageCode} {languageCodes} />
		{/each}
	</div>
</div>
