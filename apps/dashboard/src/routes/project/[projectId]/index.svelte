<script lang="ts">
	import { projectStore } from '$lib/stores/projectStore';
	import { ProgressBar, PaginationNav } from 'carbon-components-svelte';

	let currentPageNumber = 0;
	export let pageSize = 10;
	export let noCharacters = 80;
	export let noWords = 5;
	/* 	export let activityLog = 'testactivity';
	 */
	$: languages =
		$projectStore.data?.languages.slice(
			currentPageNumber * pageSize,
			(currentPageNumber + 1) * pageSize
		) ?? [];

	const allMessageIds = $projectStore.data?.resources.getMessageIdsForAllResources();
</script>

<section>
	<grid class="grid-cols-2 gap-10">
		<column class="space-y-1">
			<h3>Progress</h3>
			<column class="space-y-4">
				{#each languages as language}
					<div>
						<p class="font-bold text-base">{language.iso_code}</p>
						<ProgressBar value={20} helperText="24%" />
						<row class="justify-between">
							<a href="/" class="text-blue-700">Show all un-reviewed translations</a>
							<!-- <a href="/" class="text-blue-700">Show changed in last 7 days</a> -->
						</row>
					</div>
				{/each}
			</column>
			<PaginationNav total={allMessageIds?.size} shown={pageSize} bind:page={currentPageNumber} />
		</column>
		<column class="space-y-1">
			<h3>Statistics</h3>
			<row class="justify-between max-w-xs">
				<column>
					<div class="text-lg text-gray-500">Words</div>
					<div class="text-lg">{noWords}</div>
				</column>
				<column>
					<div class="text-lg text-gray-500">Characters</div>
					<div class="text-lg">{noCharacters}</div>
				</column>
			</row>
		</column>
	</grid>
</section>
