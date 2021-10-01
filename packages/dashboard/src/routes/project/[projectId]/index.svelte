<script lang="ts">
	import Edit24 from 'carbon-icons-svelte/lib/Edit24';
	import { projectStore } from '$lib/stores/projectStore';

	import {
		ProgressBar,
		Breadcrumb,
		BreadcrumbItem,
		CodeSnippet,
		Pagination,
		Button,
		PaginationNav
	} from 'carbon-components-svelte';

	let currentPageNumber: number = 0;
	export let pageSize = 10;
	let organization: string;
	export let noCharacters = 80;
	export let noWords = 5;
	/* 	export let activityLog = 'testactivity';
	 */
	$: languages =
		$projectStore.data?.languages.slice(
			currentPageNumber * pageSize,
			(currentPageNumber + 1) * pageSize
		) ?? [];
	//$: organization =
	$projectStore.data?.project.organization_id;
</script>

<section>
	<grid class="grid-cols-2 gap-10">
		<column class="space-y-1">
			<h3>Progress</h3>
			{#each languages as language}
				<span class="mr-8" />
				<div class="font-bold text-base">{language.iso_code}</div>
				<ProgressBar value={20} />
				<div class="mt-4">
					<a href="/" class="text-blue-700">Show all untranslated</a>
					<a href="/" class="ml-24 text-blue-700">Show changed in last 7 days</a>
				</div>
			{/each}
			<PaginationNav
				total={$projectStore.data?.translations.length ?? 0}
				shown={pageSize}
				bind:page={currentPageNumber}
			/>
		</column>
		<column class="space-y-1">
			<h3>Statistics</h3>
			<div class="flex">
				<div>
					<div>
						<div class="text-lg text-gray-500">Words</div>
						<div class="text-lg">{noWords}</div>
					</div>
				</div>
				<div class="ml-40">
					<div class="text-lg text-gray-500">Characters</div>
					<div class="text-lg">{noCharacters}</div>
				</div>
			</div>
		</column>
	</grid>
</section>
