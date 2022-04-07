<script lang="ts">
	import { Message, serializePattern, type Resource } from '@inlang/fluent-ast';
	import { identity } from 'svelte/internal';
	import { get } from 'svelte/store';
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
			messageId: string;
			messages: Record<string, Message | undefined>;
			attributeIds: string[];
		}[] = [];
		for (const messageId of messageIds) {
			const messages = Object.fromEntries(
				languageCodes.map((languageCode) => [
					languageCode,
					$resources[languageCode]?.get({ message: { id: messageId } })
				])
			);
			const attributeIds = Array.from(
				languageCodes.reduce((result, languageCode) => {
					return new Set([
						...result,
						...(messages[languageCode]?.attributes.map((attribute) => attribute.id.name) ?? [])
					]);
				}, new Set<string>())
			);
			result.push({
				messageId: messageId,
				messages,
				attributeIds
			});
		}
		return result;
	};
</script>

<Menubar />
<div class="grid grid-cols-4">
	<Sidebar class="col-span-1" />
	<div class="col-span-3 flex flex-col space-y-2">
		{#each rows() as row}
			<sl-card>
				<h3 slot="header" class="title-md">{row.messageId}</h3>
				{#each languageCodes as languageCode}
					{@const message = row.messages[languageCode]}
					{@const pattern = message?.value ? serializePattern(message.value) : undefined}
					{#if pattern}
						<sl-textarea rows="2" resize="auto" value={pattern}>
							<h4 slot="label" class="title-sm">{languageCode}</h4>
						</sl-textarea>
					{:else}
						<h4 class="title-sm">Pattern</h4>
						<div class="flex items-center body-sm decoration-dotted">
							<sl-icon name="info-circle" class="mr-1" />
							<p class="decoration-dotted">This message has no pattern.</p>
							<sl-button variant="text" size="small" on:click={() => alert('unimplemented')}>
								Create pattern
							</sl-button>
						</div>
					{/if}
				{/each}
			</sl-card>
			{#each row.attributeIds as attributeId}
				{#each languageCodes as languageCode}
					{@const attribute = row.messages[languageCode]?.attributes.find(
						(attribute) => attribute.id.name === attributeId
					)}
					{@const pattern = attribute?.value ? serializePattern(attribute.value) : undefined}
					<div class="flex">
						<div class="w-12 h-full flex items-center justify-center">
							<!-- TODO treeview line -->
							<!-- <div class="h-0.5 w-20 bg-neutral-300 rotate-90" /> -->
						</div>
						<sl-details class="w-full">
							<h3 slot="summary" class="title-md">.{attributeId}</h3>
							<sl-textarea rows="2" resize="auto" value={pattern}>
								<h4 slot="label" class="title-sm">Pattern</h4>
							</sl-textarea>
						</sl-details>
					</div>
				{/each}
			{/each}
		{/each}
	</div>
</div>
