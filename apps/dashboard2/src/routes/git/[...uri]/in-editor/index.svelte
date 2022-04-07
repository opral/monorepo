<script lang="ts">
	import { languageName } from '$lib/utils/languageName';

	import { Attribute, Message, serializePattern, type Resource } from '@inlang/fluent-ast';
	import { inlangConfig, resources } from '../_store';
	import Menubar from './_Menubar.svelte';
	import Sidebar from './_Sidebar.svelte';

	const baseLanguageCode = $inlangConfig?.baseLanguageCode ?? 'en';
	const baseResource = $resources[baseLanguageCode] as Resource;

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
				actionRequired: false
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
					actionRequired: false
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
			<sl-card class="space-y-2" class:ml-12={row.baseNode.type === 'Attribute'}>
				<h3 slot="header" class="title-md">{row.id}</h3>
				{#each languageCodes as languageCode}
					{@const node = row.nodes[languageCode]}
					{@const serializedPattern = node?.value ? serializePattern(node.value) : undefined}
					{#if serializedPattern === undefined}
						<h4 class="title-sm">{languageName(languageCode)}</h4>
						<div class="flex items-center body-md decoration-dotted">
							<sl-icon name="info-circle" class="mr-1" />
							<p>This language has no pattern.</p>
							<sl-button variant="text" on:click={() => alert('unimplemented')}>
								Create pattern
							</sl-button>
						</div>
					{:else}
						<sl-textarea rows="2" resize="auto" value={serializedPattern ?? ''}>
							<h4 slot="label" class="title-sm pb-1">{languageName(languageCode)}</h4>
						</sl-textarea>
					{/if}
				{/each}
			</sl-card>
		{/each}
	</div>
</div>
