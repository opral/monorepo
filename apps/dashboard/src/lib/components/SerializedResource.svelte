<script lang="ts">
	import { Converter, converters } from '@inlang/fluent-format-converters';
	import { LanguageCode } from '@inlang/utils';
	import { Resources } from '@inlang/fluent-ast';
	import { Dropdown } from 'carbon-components-svelte';
	import { onMount } from 'svelte';
	import SelectHumanLanguageTile from './tiles/SelectHumanLanguageTile.svelte';
	import { t } from '$lib/services/i18n';

	export let resources: Resources;

	/**
	 * Defaults to the fluent converter (format).
	 */
	export let selectedConverter: Converter = converters.fluent;
	$: selectedConverter = Object.values(converters)[selectedConverterIndex];

	/**
	 * Defaults to the first language code in the resources.
	 */
	export let selectedLanguageCode: LanguageCode = resources.containedLanguageCodes()[0];

	let selectedConverterIndex = 0;

	onMount(() => {
		// by default set the converter to fluent
		selectedConverterIndex = Object.keys(converters).indexOf('fluent');
	});
</script>

<grid class="grid-cols-3 gap-10">
	<column class="justify-between">
		<div class="col-span-1">
			<Dropdown
				class="w-fill"
				titleText={$t('select.format')}
				bind:selectedIndex={selectedConverterIndex}
				items={Object.entries(converters).map(([format], index) => ({
					id: '' + index,
					text: format
				}))}
			/>
			<br />
			<SelectHumanLanguageTile
				legend={$t('select.human-language')}
				bind:selected={selectedLanguageCode}
				possibleLanguageCodes={resources.containedLanguageCodes()}
			/>
		</div>
		<slot name="button" />
	</column>
	<div class="col-span-2">
		<slot name="code-field" />
	</div>
</grid>
