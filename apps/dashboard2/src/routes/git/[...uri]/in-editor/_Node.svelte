<script lang="ts">
	import { languageName } from '$lib/utils/languageName';
	import { Attribute, Message, serializePattern } from '@inlang/fluent-ast';

	export let baseLanguageCode: string;
	export let languageCodes: string[];
	export let row: {
		id: string;
		baseNode: Attribute | Message;
		nodes: Record<string, Message | Attribute | undefined>;
		actionRequired: boolean;
	};
</script>

<sl-card class:ml-12={row.baseNode.type === 'Attribute'}>
	<div slot="header" class="flex justify-between">
		<h3 class="title-md">{row.id}</h3>
		{#if row.actionRequired}
			<sl-tag variant="danger" size="small">Action required</sl-tag>
		{/if}
	</div>
	<div class="space-y-2">
		{#each languageCodes as languageCode}
			{@const node = row.nodes[languageCode]}
			{@const serializedPattern = node?.value ? serializePattern(node.value) : undefined}
			{#if row.baseNode.value === null}
				<!-- show create pattern message if the current row is the "base row" -->
				{#if languageCode === baseLanguageCode}
					<div class="flex items-center body-md decoration-dotted">
						<sl-icon name="info-circle" class="mr-1" />
						<p>This message has no pattern in the base language.</p>
					</div>
					<sl-button variant="text" on:click={() => alert('unimplemented')}>
						Create pattern
					</sl-button>
				{/if}
			{:else}
				<sl-textarea
					rows="2"
					resize="auto"
					value={serializedPattern ?? ''}
					class:textarea-error={serializedPattern === undefined}
				>
					<h4 slot="label" class="title-sm pb-1">{languageName(languageCode)}</h4>
					{#if serializedPattern === undefined}
						<p slot="help-text">Missing pattern.</p>
					{/if}
				</sl-textarea>
			{/if}
		{/each}
	</div>
	<div slot="footer" class="flex justify-between">
		<div>
			<sl-button variant="primary">
				<sl-icon src="/icons/save-floppy-disk.svg" slot="prefix" />
				Save changes
			</sl-button>
			<sl-button>
				<sl-icon name="robot" slot="prefix" />
				Machine translate
			</sl-button>
		</div>
		<!-- <sl-button>
            <sl-icon name="arrow-counterclockwise" slot="prefix" />
        </sl-button> -->
	</div>
</sl-card>

<style lang="postcss">
	.textarea-error::part(base) {
		@apply border-error-container;
	}

	.textarea-error::part(form-control-help-text) {
		@apply text-error;
	}
</style>
