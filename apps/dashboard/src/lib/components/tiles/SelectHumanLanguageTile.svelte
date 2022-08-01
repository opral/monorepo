<script lang="ts">
	import ISO6391 from 'iso-639-1';
	import { RadioTile, TileGroup } from 'carbon-components-svelte';
	import { LanguageCode } from '@inlang/utils';

	export let possibleLanguageCodes: LanguageCode[];
	export let selected: LanguageCode | undefined;
	export let onSelect: ((languageCode: LanguageCode) => unknown) | undefined = undefined;
	export let legend: string | undefined = undefined;
</script>

<TileGroup on:select={(event) => onSelect?.(event.detail)} bind:selected {legend}>
	{#each possibleLanguageCodes as languageCode}
		<RadioTile light value={languageCode}>
			{ISO6391.getName(languageCode)} - {languageCode}
		</RadioTile>
	{/each}
</TileGroup>
