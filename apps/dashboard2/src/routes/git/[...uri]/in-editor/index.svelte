<script lang="ts">
	import type { Attribute, Message } from '@inlang/fluent-ast';
	import { inlangConfig, resources } from '../_store';
	import Menubar from './_Menubar.svelte';
	import Node from './_Node.svelte';
	import Sidebar from './_Sidebar.svelte';

	const baseLanguageCode = $inlangConfig?.baseLanguageCode ?? 'en';

	const languageCodes = Object.keys($resources);

	/** all ids of all resources */
	const messageIds = Array.from(
		languageCodes.reduce((result, languageCode) => {
			return new Set([...result, ...($resources[languageCode]?.includedMessageIds() ?? [])]);
		}, new Set<string>())
	);

	/** Mapping the messages from the AST's with language codes. */
	const rows = () => {
		const result: {
			id: string;
			baseNode: Attribute | Message;
			nodes: Record<string, Message | Attribute | undefined>;
			actionRequired: boolean;
		}[] = [];
		for (const messageId of messageIds) {
			const messages = Object.fromEntries(
				languageCodes.map((languageCode) => [
					languageCode,
					$resources[languageCode]?.get({ message: { id: messageId } })
				])
			);
			// pushing the message itself
			result.push({
				id: messageId,
				// assumption that the baseNode always exists
				baseNode: messages[baseLanguageCode] as Message,
				nodes: messages,
				actionRequired: Object.values(messages).some((message) => !message?.value)
			});
			const attributeIds = Array.from(
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
					id: '.' + attributeId,
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

<Menubar />
<div class="grid grid-cols-4">
	<Sidebar class="col-span-1" />
	<div class="col-span-3 flex flex-col space-y-2">
		{#each rows() as row}
			<Node {row} {baseLanguageCode} {languageCodes} />
		{/each}
	</div>
</div>
