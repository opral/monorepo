<script lang="ts">
	import type { Attribute, Message } from '@inlang/fluent-ast';
	import { inlangConfig, resources } from '../_store';
	import Node from './_components/Node.svelte';
	import Menubar from './_components/Menubar.svelte';
	import { page } from '$app/stores';

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
			const baseNode = messages[baseLanguageCode] as Message;
			// pushing the message itself
			result.push({
				messageId: messageId,
				// assumption that the baseNode always exists
				baseNode,
				nodes: messages,
				// if the base message has no pattern, patterns are not required for translations
				// since the message is a message with attributes.
				actionRequired: baseNode.value
					? Object.values(messages).some((message) => message?.value === undefined)
					: false
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

<sl-alert open variant="primary">
	<sl-icon slot="icon" name="info-circle" />
	<div class="flex items-center">
		<div class="w-full">
			<h3 class="title-md">Welcome to the demo!</h3>
			<p class="body-md">
				Everything works on top of git with no database whatsoever leading to low adoption friction
				+ version control + review system and overall working (none-existent) sync.
				<br />
				Take a look at the underlying repository
				<a class="link" href="https://github.com/inlang/demo" target="_blank"> here </a>.
			</p>
		</div>
	</div>
</sl-alert>
<div class="flex gap-4">
	<div class="w-full">
		<!-- <Menubar /> -->
		<div class="grid grid-cols-4 pt-2">
			<!-- <Sidebar class="col-span-1" /> -->
			<div class="col-span-4 flex flex-col space-y-2">
				{#if rows().some((row) => row.actionRequired)}
					<sl-alert open variant="warning">
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
	</div>
	{#if $page.params['uri'].includes('inlang/demo')}
		<div style="height:40rem;" class="sticky top-10">
			<h2 class="headline-sm">Preview:</h2>
			<a class="title-md text-primary" href="https://inlang-demo.netlify.app" target="_blank">
				inlang-demo.netlify.app</a
			>
			<p class="body-md">Refresh this site to reflect changes.</p>
			<p class="body-md italic text-gray-500">
				Keep in mind that changes can take ≈25s to propagate.
			</p>
			<embed
				src="https://inlang-demo.netlify.app/"
				type="text/html"
				class="border rounded h-full mt-2"
			/>
		</div>
	{/if}
</div>
