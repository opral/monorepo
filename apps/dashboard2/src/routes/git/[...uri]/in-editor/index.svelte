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
					<h4 class="title-sm pt-4 pb-0.5">Attributes</h4>
					<div class="space-y-4">
						{#each message.attributes as attribute}
							<sl-details>
								<h3 slot="summary" class="title-md">.{attribute.id.name}</h3>
								hello
							</sl-details>
						{/each}
					</div>
				</sl-card>
			{/if}
		{/each}
	</div>
</div>
