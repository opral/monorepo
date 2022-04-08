<!-- 
	A single node (attribute or message) in the editor view.
 -->
<script lang="ts">
	import { languageName } from '$lib/utils/languageName';
	import { Attribute, Message, serializePattern } from '@inlang/fluent-ast';
	import { fade } from 'svelte/transition';
	import { fs } from '$lib/stores/filesystem';
	import { commit } from '../_logic/commit';
	import { writeResources } from '@inlang/core';
	import { inlangConfig, resources, searchParams } from '../_store';
	import { cloneDeep } from 'lodash-es';
	import type { InlangConfig } from '@inlang/config';

	export let baseLanguageCode: string;
	export let languageCodes: string[];
	export let row: {
		attributeId?: string;
		messageId: string;
		baseNode: Attribute | Message;
		nodes: Record<string, Attribute | Message | undefined>;
		actionRequired: boolean;
	};

	let saveButtonIsLoading = false;

	let title = row.attributeId ? `.${row.attributeId}` : row.messageId;

	/**
	 * The modified patterns.
	 *
	 * Contains a current and modified pattern to detect changes.
	 * "Current" refers to the current state on the file system.
	 * "Modified" refers to the AST representation of a resource.
	 */
	let modifiedPatterns: Record<string, { current: string; modified: string }>;
	$: modifiedPatterns = Object.fromEntries(
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

	// TODO update resources
	async function commitChanges() {
		try {
			saveButtonIsLoading = true;
			// writing the translation files to disk
			let cloned = cloneDeep($resources);
			// go through all potentially modified patterns
			for (const [languageCode, patterns] of Object.entries(modifiedPatterns)) {
				const resource = cloned[languageCode];
				// continue if no changes were made
				if (patterns.current === patterns.modified) {
					continue;
				} else if (resource === undefined) {
					alert(`No resource for '${languageCode}' exists.`);
				}
				// pattern is an attribute
				else if (row.attributeId) {
					cloned[languageCode] = resource
						.upsertAttribute({
							attribute: Attribute.from({ id: row.attributeId, value: patterns.modified }).unwrap(),
							messageId: row.messageId
						})
						.unwrap();
				}
				// the row is a message
				else {
					cloned[languageCode];
					alert('unimplemented message change E94344');
				}
			}
			(
				await writeResources({
					fs: $fs,
					directory: $searchParams.dir,
					resources: cloned,
					...($inlangConfig as InlangConfig['latest'])
				})
			).unwrap();
			(
				await commit({
					fs: fs.callbackBased,
					message: `Update translation '${row.messageId}'`,
					author: {
						name: 'inlang.dev',
						email: 'anonymous-user-submission@inlang.dev'
					},
					dir: '/'
				})
			).unwrap();
			fs.refresh();
		} catch (error) {
			console.error(error);
			alert((error as Error).message);
		} finally {
			saveButtonIsLoading = false;
		}
	}
</script>

<sl-card class:ml-12={row.baseNode.type === 'Attribute'}>
	<div slot="header" class="flex justify-between">
		<h3 class="title-md">{title}</h3>
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
					on:input={(event) => (modifiedPatterns[languageCode].modified = event.srcElement.value)}
					class:textarea-error={modifiedPatterns[languageCode].current === ''}
					class:textarea-unsaved-changes={modifiedPatterns[languageCode].current !==
						modifiedPatterns[languageCode].modified}
				>
					<h4 slot="label" class="title-sm pb-1">{languageName(languageCode)}</h4>
					<!-- cant use `hasChanges()` because hasChanges applies to all patterns, not a single one -->
					{#if modifiedPatterns[languageCode].current !== modifiedPatterns[languageCode].modified}
						<p slot="help-text">Unsaved changes.</p>
					{:else if modifiedPatterns[languageCode].current === ''}
						<p slot="help-text">Missing pattern.</p>
					{/if}
				</sl-textarea>
			{/if}
		{/each}
	</div>
	<div slot="footer" class="flex justify-between">
		<div>
			<sl-button
				variant="primary"
				disabled={hasChanges === false}
				on:click={commitChanges}
				loading={saveButtonIsLoading}
			>
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

	.textarea-unsaved-changes::part(form-control-help-text) {
		@apply text-warning;
	}
</style>
