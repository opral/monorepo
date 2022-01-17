<script lang="ts">
	import PatternEditor from './fluent/PatternEditor.svelte';
	import ISO6391 from 'iso-639-1';
	import { LanguageCode } from '@inlang/common';
	import { parseEntry, Pattern, serializePattern } from '@inlang/fluent-syntax';
	import { Button, ButtonSet, ClickableTile, Tag, Tile } from 'carbon-components-svelte';
	import ChevronDown20 from 'carbon-icons-svelte/lib/ChevronDown20';
	import ChevronUp20 from 'carbon-icons-svelte/lib/ChevronUp20';
	import TrashCan20 from 'carbon-icons-svelte/lib/TrashCan20';
	import Bot20 from 'carbon-icons-svelte/lib/Bot20';
	import Save20 from 'carbon-icons-svelte/lib/Save20';
	import { isEqual } from 'lodash-es';

	/**
	 * The id to which the pattern belongs.
	 *
	 * Note that the id can be a message id in the form of "hello-world",
	 * but also an attribute id e.g. "hello-world.attribute".
	 */
	export let id: string;

	/**
	 * The (existent) patterns.
	 *
	 * The key is of type `LanguageCode`.
	 */
	export let patterns: Record<string, Pattern | undefined>;

	/**
	 * The language codes for which patterns must exist.
	 *
	 * Is used to determine missing patterns (translations).
	 */
	export let requiredLanguageCodes: LanguageCode[];

	/**
	 * The base language code.
	 *
	 * Is used to derive the "source of truth".
	 */
	export let sourceLanguageCode: LanguageCode;

	export let displayActionRequired: boolean;

	export let onSaveChanges: (serializedPatterns: Record<LanguageCode, string>) => Promise<unknown>;

	export let onDelete: () => Promise<unknown>;

	/**
	 * Internal (component scoped) representation of patterns in serialized form.
	 *
	 * Necessary to avoid reactivity/mutability bugs caused by directly binding
	 * the input fields.
	 *
	 *
	 */
	let serializedPatterns = serializePatterns({ patterns });

	let expanded = false;

	/**
	 * whether the user made changes to any message
	 */
	$: hasChanges = isEqual(serializedPatterns, serializePatterns({ patterns })) === false;

	// update the internal represenation of patterns if the external representation differs.
	// (in other words: has been updated)
	$: if (isEqual(serializedPatterns, serializePatterns({ patterns }))) {
		serializedPatterns = serializePatterns({ patterns });
	}

	$: allPatternsAreValid = Object.values(serializedPatterns).every(
		(pattern) => parseEntry(`dummy-id = ${pattern}`).isOk
	);

	/**
	 * All patterns in serialized form.
	 *
	 */
	function serializePatterns(args: {
		patterns: Record<string, Pattern | undefined>;
	}): Record<string, string> {
		return Object.fromEntries(
			Object.entries(args.patterns).map(([languageCode, pattern]) => [
				languageCode,
				pattern ? serializePattern(pattern) : ''
			])
		) as Record<LanguageCode, string>;
	}
</script>

<div>
	<ClickableTile on:click={() => (expanded = !expanded)}>
		<row class="justify-between items-center">
			<row class="space-x-3 items-center">
				{#if expanded}
					<ChevronUp20 />
				{:else}
					<ChevronDown20 />
				{/if}
				<p>{id}</p>
			</row>
			{#if displayActionRequired}
				<Tag type="red">Action required</Tag>
			{/if}
		</row>
	</ClickableTile>
	{#if expanded}
		<Tile>
			<slot name="above-expanded" />
			<grid class="grid-cols-4 gap-2">
				{#each Array.from(new Set(Object.keys(patterns).concat(requiredLanguageCodes))) as languageCode}
					<row class="col-span-1 space-x-2 items-center">
						<Tag type={languageCode === sourceLanguageCode ? 'green' : 'blue'}>
							{languageCode}
						</Tag>
						<p class="text-sm">{ISO6391.getName(languageCode)}</p>
					</row>
					<PatternEditor
						emptyPatternIsOk={languageCode === sourceLanguageCode}
						class="col-span-3"
						bind:serializedPattern={serializedPatterns[languageCode]}
						serializedSourcePattern={serializedPatterns[sourceLanguageCode]}
					/>
				{/each}
			</grid>
			<br />
			<br />
			<!-- actions -->
			<row class="justify-between">
				<ButtonSet>
					<Button
						kind="primary"
						size="field"
						disabled={hasChanges === false || allPatternsAreValid === false}
						icon={Save20}
						on:click={() => onSaveChanges(serializedPatterns)}
					>
						Save changes
					</Button>
					<Button kind="secondary" size="field" disabled icon={Bot20}>Auto translate</Button>
				</ButtonSet>
				<Button
					kind="danger-tertiary"
					size="field"
					icon={TrashCan20}
					iconDescription="Delete"
					on:click={onDelete}
				/>
			</row>
		</Tile>
	{/if}
</div>
