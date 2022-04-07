<script lang="ts">
	import type { SlDropdown } from '@shoelace-style/shoelace';
	import { inlangConfig } from '../_store';
	import { onMount } from 'svelte';
	import { languageName } from '$lib/utils/languageName';

	let filterDropdown: SlDropdown;

	onMount(() => {
		filterDropdown.stayOpenOnSelect = true;
	});
</script>

<div role="menubar" class="flex space-x-2">
	<sl-input placeholder="Search id's" size="medium" class="w-full">
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
					<sl-checkbox class="hover-fix">{languageName(languageCode)}</sl-checkbox>
				</sl-menu-item>
			{/each}
		</sl-menu>
	</sl-dropdown>
</div>

<style>
	/** the text color is not white on hover because a checkbox is not supposed to be in a dropdown */
	.hover-fix::part(base):hover {
		color: white;
	}
</style>
