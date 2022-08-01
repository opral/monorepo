<script lang="ts">
	import PatternEditor from './fluent/PatternEditor.svelte';
	import ISO6391 from 'iso-639-1';
	import { LanguageCode } from '@inlang/utils';
	import { parseEntry, Pattern, serializePattern } from '@inlang/fluent-ast';
	import { Button, ButtonSet, ClickableTile, Tag, Tile } from 'carbon-components-svelte';
	import ChevronDown20 from 'carbon-icons-svelte/lib/ChevronDown20';
	import ChevronUp20 from 'carbon-icons-svelte/lib/ChevronUp20';
	import TrashCan20 from 'carbon-icons-svelte/lib/TrashCan20';
	import Bot20 from 'carbon-icons-svelte/lib/Bot20';
	import Save20 from 'carbon-icons-svelte/lib/Save20';
	import { isEqual } from 'lodash-es';
	import {
		MachineTranslateRequestBody,
		MachineTranslateResponseBody,
		SupportedLanguageCode,
		supportedLanguageCodes
	} from '../../routes/api/internal/machine-translate';
	import InlineLoadingWrapper from './InlineLoadingWrapper.svelte';
	import { t } from '$lib/services/i18n';

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
	export let baseLanguageCode: LanguageCode;

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

	let machineTranslationStatus: InlineLoadingWrapper['$$prop_def']['status'] = 'inactive';
	let machineTranslationErrorMessage = '';

	/**
	 * whether the user made changes to any message
	 */
	$: hasChanges = isEqual(serializedPatterns, serializePatterns({ patterns })) === false;

	$: hasMissingPatterns =
		requiredLanguageCodes.every((code) => serializedPatterns[code] !== '') === false;

	// update the internal represenation of patterns if the external representation differs.
	// (in other words: has been updated)
	$: if (isEqual(serializedPatterns, serializePatterns({ patterns }))) {
		serializedPatterns = serializePatterns({ patterns });
	}

	$: allPatternsAreValid = Object.values(serializedPatterns).every(
		(pattern) => parseEntry(`dummy-id = ${pattern}`).isOk
	);

	async function machineTranslate(): Promise<void> {
		machineTranslationStatus = 'active';
		for (const languageCode of requiredLanguageCodes) {
			if (languageCode === baseLanguageCode) {
				continue;
			} else if (
				supportedLanguageCodes.includes(baseLanguageCode as SupportedLanguageCode) === false
			) {
				machineTranslationStatus = 'error';
				machineTranslationErrorMessage = $t('error.unsupported-base-language', {
					baseLanguageCode
				});
				break;
			} else if (supportedLanguageCodes.includes(languageCode as SupportedLanguageCode) === false) {
				alert($t('error.unsupported-language-code', { languageCode }));
			} else {
				const requestBody: MachineTranslateRequestBody = {
					serializedSourcePattern: serializedPatterns[baseLanguageCode],
					sourceLanguageCode: baseLanguageCode as SupportedLanguageCode,
					targetLanguageCode: languageCode as SupportedLanguageCode
				};
				const response = await fetch('/api/internal/machine-translate', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
						// 'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: JSON.stringify(requestBody)
				});
				if (response.ok === false) {
					machineTranslationStatus = 'error';
					machineTranslationErrorMessage = `Something went wrong. (Code: ${
						response.status
					}) ${await response.text()}`;
					break;
				} else {
					const responseBody = (await response.json()) as MachineTranslateResponseBody;
					serializedPatterns[languageCode] = responseBody.serializedPattern;
					machineTranslationStatus = 'finished';
				}
			}
		}
	}

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
				<Tag type="red">{$t('action-required')}</Tag>
			{/if}
		</row>
	</ClickableTile>
	{#if expanded}
		<Tile>
			<slot name="above-expanded" />
			<grid class="grid-cols-4 gap-2">
				{#each Array.from(new Set(Object.keys(patterns).concat(requiredLanguageCodes))) as languageCode}
					<row class="col-span-1 space-x-2 items-center">
						<Tag type={languageCode === baseLanguageCode ? 'green' : 'blue'}>
							{languageCode}
						</Tag>
						<p class="text-sm">{ISO6391.getName(languageCode)}</p>
					</row>
					<PatternEditor
						emptyPatternIsOk={languageCode === baseLanguageCode}
						class="col-span-3"
						bind:serializedPattern={serializedPatterns[languageCode]}
						serializedSourcePattern={serializedPatterns[baseLanguageCode]}
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
						{$t('save-changes')}
					</Button>
					{#if machineTranslationStatus === 'inactive'}
						<Button
							kind="secondary"
							size="field"
							disabled={hasMissingPatterns === false}
							on:click={machineTranslate}
							icon={Bot20}
						>
							{$t('machine-translate')}
						</Button>
					{:else}
						<InlineLoadingWrapper
							class="px-2 flex flex-row items-center"
							bind:status={machineTranslationStatus}
							activeDescription={$t('loading.machine-translating')}
							errorDescription={machineTranslationErrorMessage}
							finishedDescription={$t('generic.finished')}
						/>
					{/if}
				</ButtonSet>
				<Button
					kind="danger-tertiary"
					size="field"
					icon={TrashCan20}
					iconDescription={$t('generic.delete')}
					on:click={onDelete}
				/>
			</row>
		</Tile>
	{/if}
</div>
