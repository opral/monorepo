<!-- 
	A single node (attribute or message) in the editor view.
 -->
<script lang="ts">
	import { languageName } from '$lib/utils/languageName';
	import { Attribute, Message, serializePattern } from '@inlang/fluent-ast';
	import { fade } from 'svelte/transition';

	export let baseLanguageCode: string;
	export let languageCodes: string[];
	export let row: {
		id: string;
		baseNode: Attribute | Message;
		nodes: Record<string, Message | Attribute | undefined>;
		actionRequired: boolean;
	};

	/**
	 * The modified patterns.
	 *
	 * Contains a current and modified pattern to detect changes.
	 */
	const modifiedPatterns: Record<string, { current: string; modified: string }> =
		Object.fromEntries(
			// initializing the object with the language codes to avoid
			// undefined values which can lead to throws
			languageCodes.map((languageCode) => {
				const node = row.nodes[languageCode];
				const serializedPattern = node?.value ? serializePattern(node.value) : undefined;
				return [
					languageCode,
					{ current: serializedPattern ?? '', modified: serializedPattern ?? '' }
				];
			})
		);

	$: hasChanges = Object.values(modifiedPatterns).some(
		({ current, modified }) => current !== modified
	);
</script>

<sl-card class:ml-12={row.baseNode.type === 'Attribute'}>
	<div slot="header" class="flex justify-between">
		<h3 class="title-md">{row.id}</h3>
		{#if row.actionRequired}
			<div class="flex space-x-1">
				{#if hasChanges}
					<sl-tag variant="warning" size="small" transition:fade>Unsaved changes</sl-tag>
				{/if}
				<sl-tag variant="danger" size="small" transition:fade>Action required</sl-tag>
			</div>
		{/if}
	</div>
	<div class="space-y-2">
		{#each languageCodes as languageCode}
			{@const node = row.nodes[languageCode]}
			{@const serializedPattern = node?.value ? serializePattern(node.value) : undefined}
			{#if row.baseNode.value === null}
				<!-- show create pattern message if the current row is the "base row" -->
				{#if languageCode === baseLanguageCode}
					<div class="flex items-center body-md">
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
					on:input={(event) => (modifiedPatterns[languageCode].current = event.srcElement.value)}
					class:textarea-error={modifiedPatterns[languageCode].current === ''}
					class:textarea-unsaved-changes={modifiedPatterns[languageCode].current !==
						modifiedPatterns[languageCode].modified}
				>
					<h4 slot="label" class="title-sm pb-1">{languageName(languageCode)}</h4>
					{#if modifiedPatterns[languageCode].current === ''}
						<p slot="help-text">Missing pattern.</p>
					{/if}
				</sl-textarea>
			{/if}
		{/each}
	</div>
	<div slot="footer" class="flex justify-between">
		<div>
			<sl-button variant="primary" disabled={hasChanges === false}>
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

	.textarea-unsaved-changes::part(base) {
		@apply border-warning-container;
	}
</style>
