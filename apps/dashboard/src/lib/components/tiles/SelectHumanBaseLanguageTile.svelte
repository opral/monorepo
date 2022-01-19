<script lang="ts">
	import ISO6391 from 'iso-639-1';
	import { RadioTile, TileGroup } from 'carbon-components-svelte';
	import { LanguageCode } from '@inlang/common';

	export let possibleLanguageCodes: LanguageCode[];
	export let selected: LanguageCode | undefined;
	export let onSelect: ((languageCode: LanguageCode) => unknown) | undefined = undefined;
	export let showLegend = true;
</script>

<TileGroup
	on:select={(event) => onSelect?.(event.detail)}
	bind:selected
	legend={showLegend ? 'Select (human) base language' : undefined}
>
	{#each possibleLanguageCodes as languageCode}
		<RadioTile light value={languageCode}>
			{ISO6391.getName(languageCode)} - {languageCode}
		</RadioTile>
	{/each}
</TileGroup>
