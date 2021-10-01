<script lang="ts">
	import Edit24 from 'carbon-icons-svelte/lib/Edit24';
	import { projectStore } from '$lib/stores/projectStore';

	import {
		ProgressBar,
		Breadcrumb,
		BreadcrumbItem,
		CodeSnippet,
		Pagination,
		Button
	} from 'carbon-components-svelte';
	import { PageNumber16 } from 'carbon-icons-svelte';

	let currentPageNumber: number = 0;
	export let pageSize = 10;
	let organization: string;
	export let noCharacters = 80;
	export let noWords = 5;
	export let activityLog = 'testactivity';

	$: languages =
		$projectStore.data?.languages.slice(
			currentPageNumber * pageSize,
			(currentPageNumber + 1) * pageSize
		) ?? [];
	//$: organization =
	$projectStore.data?.project.organization_id;

	console.log(languages);
</script>

<section class=" -ml-40 -mt-64 pt-0 pr-24 pb-64 pl-24 m-0 w-full">
	<div class="mt-32 mr-16 mb-0 flex align-middle flex-shrink-0">
		<Breadcrumb>
			<BreadcrumbItem href="/">Organizations</BreadcrumbItem>
			<BreadcrumbItem href="/">{$projectStore.data?.project}</BreadcrumbItem>
			<BreadcrumbItem href="/">{$projectStore.data?.project.name}</BreadcrumbItem>
		</Breadcrumb>
	</div>
	<main class="mt-12 mr-16 mb-0 ml-16 flex flex-col min-h-360">
		<div class="flex align-middle mb-24">
			<h3 class="flex align-middle mb-0">{$projectStore.data?.project.name}</h3>
			<div class="ml-24 h-32 w-30">
				<Button icon={Edit24} href="/" size="small">Open editor</Button>
			</div>

			<div class="ml-24 flex flex-row text-sm">
				<p>Project ID:</p>
				<div class="ml-2 -mt-2">
					<CodeSnippet>{$projectStore.data?.project.id}</CodeSnippet>
				</div>
			</div>
		</div>
	</main>
	<div class="flex -mt-32">
		<div class="mr-40 w-1/2">
			<h3>Progress</h3>
			<div class="m-0">
				{#each languages as language}
					<span class="mr-8" />
					<div class="font-bold text-base">{language.iso_code}</div>
					<ProgressBar value={20} />
					<div class="mt-4">
						<a href="/" class="text-blue-700">Show all untranslated</a>
						<a href="/" class="ml-24 text-blue-700">Show changed in last 7 days</a>
					</div>
				{/each}
			</div>
			<div class="mt-16">
				<Pagination
					totalItems={$projectStore.data?.translations.length}
					{pageSize}
					bind:page={currentPageNumber}
				/>
			</div>
		</div>
		<div class="-ml-16 w-1/2">
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
			<div>
				<h3 class="mt-12">Activity</h3>
				<div class="mt-8">{activityLog}</div>
			</div>
		</div>
	</div>
</section>
