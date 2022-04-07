<script lang="ts">
	import { serializePattern, type Resource } from '@inlang/fluent-ast';
	import { inlangConfig, resources } from '../_store';
	import Menubar from './_Menubar.svelte';
	import Sidebar from './_Sidebar.svelte';

	const baseResource = $resources[$inlangConfig?.baseLanguageCode ?? 'en'] as Resource;
	const ids = baseResource.includedMessageIds();

	const messages = ids
		.map((id) => baseResource.get({ message: { id } }))
		.filter((value) => value !== undefined);
</script>

<Menubar />
<div class="grid grid-cols-4">
	<Sidebar class="col-span-1" />
	<div class="col-span-3 flex flex-col space-y-2">
		{#each messages as message}
			{@const pattern = message?.value ? serializePattern(message.value) : undefined}
			{#if message !== undefined}
				<sl-card>
					<h3 slot="header" class="title-md">{message.id.name}</h3>
					{#if pattern}
						<sl-textarea rows="2" resize="auto" value={pattern}>
							<h4 slot="label" class="title-sm">Pattern</h4>
						</sl-textarea>
					{/if}
				</sl-card>
				{#each message.attributes as attribute}
					{@const pattern = serializePattern(attribute.value)}
					<div class="flex">
						<div class="w-12 h-full flex items-center justify-center">
							<!-- TODO treeview line -->
							<!-- <div class="h-0.5 w-20 bg-neutral-300 rotate-90" /> -->
						</div>

						<sl-details class="w-full">
							<h3 slot="summary" class="title-md">.{attribute.id.name}</h3>
							<sl-textarea rows="2" resize="auto" value={pattern}>
								<h4 slot="label" class="title-sm">Pattern</h4>
							</sl-textarea>
						</sl-details>
					</div>
				{/each}
			{/if}
		{/each}
	</div>
</div>
