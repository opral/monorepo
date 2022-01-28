<script lang="ts">
	import { AdapterInterface, adapters } from '@inlang/fluent-adapters';
	import { LanguageCode } from '@inlang/common';
	import { Resources } from '@inlang/fluent-syntax';
	import { Dropdown } from 'carbon-components-svelte';
	import { onMount } from 'svelte';
	import SelectHumanLanguageTile from './tiles/SelectHumanLanguageTile.svelte';

	export let resources: Resources;

	/**
	 * Defaults to the fluent adapter.
	 */
	export let selectedAdapter: AdapterInterface = adapters.fluent;
	$: selectedAdapter = Object.values(adapters)[selectedAdapterIndex];

	/**
	 * Defaults to the first language code in the resources.
	 */
	export let selectedLanguageCode: LanguageCode = resources.containedLanguageCodes()[0];

	let selectedAdapterIndex = 0;

	onMount(() => {
		// by default set the adapter to fluent
		selectedAdapterIndex = Object.keys(adapters).indexOf('fluent');
	});
</script>

<grid class="grid-cols-3 gap-10">
	<column class="justify-between">
		<div class="col-span-1">
			<Dropdown
				class="w-fill"
				titleText="Select the adapter (format)"
				bind:selectedIndex={selectedAdapterIndex}
				items={Object.entries(adapters).map(([adapterName], index) => ({
					id: '' + index,
					text: adapterName
				}))}
			/>
			<br />
			<SelectHumanLanguageTile
				legend="Select the human language"
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
