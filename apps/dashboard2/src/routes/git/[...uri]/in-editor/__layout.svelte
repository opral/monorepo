<script lang="ts">
	import type { SlDropdown } from '@shoelace-style/shoelace';
	import { onMount } from 'svelte';
	import { inlangConfig } from '../_store';
	import ISO6391 from 'iso-639-1';

	import { countryCodeEmoji } from 'country-code-emoji';

	let filterDropdown: SlDropdown;

	onMount(() => {
		filterDropdown.stayOpenOnSelect = true;
	});
</script>

<!-- MENUBAR START -->
<div role="menubar" class="flex space-x-2">
	<sl-input placeholder="Search translations" size="medium" class="w-full">
		<sl-icon name="search" slot="prefix" />
	</sl-input>
	<sl-dropdown bind:this={filterDropdown}>
		<sl-button slot="trigger" caret>
			<sl-icon name="funnel" slot="prefix" />
			Languages
		</sl-button>
		<sl-menu>
			<sl-menu-item>
				<sl-checkbox class="hover-fix">Toggle all</sl-checkbox>
			</sl-menu-item>
			<sl-divider />
			{#each $inlangConfig?.languageCodes ?? [] as languageCode}
				<sl-menu-item>
					<sl-checkbox class="hover-fix"
						>{countryCodeEmoji(languageCode === 'en' ? 'gb' : languageCode)}
						{ISO6391.getName(languageCode)}
					</sl-checkbox>
				</sl-menu-item>
			{/each}
		</sl-menu>
	</sl-dropdown>
</div>
<!-- MENUBAR END -->
<!-- CONTENT START -->

<div class="grid">
	<slot />
</div>

<!-- CONTENT END -->
<style>
	/** the text color is not white on hover because a checkbox is not supposed to be in a dropdown */
	.hover-fix::part(base):hover {
		color: white;
	}
</style>
