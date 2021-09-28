<script lang="ts">
	import Edit24 from 'carbon-icons-svelte/lib/Edit24';

	import {
		ProgressBar,
		Breadcrumb,
		BreadcrumbItem,
		CodeSnippet,
		Pagination,
		Button
	} from 'carbon-components-svelte';
	export let projectName: string;
	export let organization: string;
	export let noCharacters = 80;
	export let noWords = 5;
	export let projectId = '4252781c-e5d4-4116-abac-374780c5ee32';
	export let activityLog = 'testactivity';
	export let languages = [
		'Afrikaans',
		'Danish',
		'French',
		'Spanish',
		'Norwegian',
		'Swedish',
		'Welsh',
		'English',
		'Italian',
		'Portugese',
		'Persian',
		'Arabic',
		'Russian',
		'Finnish'
	];
	export let langprogressions = [40, 20, 80, 100, 15, 2, 8, 29, 60, 75, 20, 90, 50, 85, 8];
</script>

<section class=" -ml-40 -mt-64 pt-0 pr-24 pb-64 pl-24 m-0 w-full">
	<div class="mt-32 mr-16 mb-0 flex align-middle flex-shrink-0">
		<Breadcrumb>
			<BreadcrumbItem href="/">Organizations</BreadcrumbItem>
			<BreadcrumbItem href="/">{organization}</BreadcrumbItem>
			<BreadcrumbItem href="/">{projectName}</BreadcrumbItem>
		</Breadcrumb>
	</div>
	<main class="mt-12 mr-16 mb-0 ml-16 flex flex-col min-h-360">
		<div class="flex align-middle mb-24">
			<h3 class="flex align-middle mb-0">projName</h3>
			<div class="ml-24 h-32 w-30">
				<Button icon={Edit24} href="/" size="small">Open editor</Button>
			</div>

			<div class="ml-24 flex flex-row text-sm">
				<p>Project ID:</p>
				<div class="ml-2 -mt-2">
					<CodeSnippet>{projectId}</CodeSnippet>
				</div>
			</div>
		</div>
	</main>
	<div class="flex -mt-32">
		<div class="mr-40 w-1/2">
			<h3>Progress</h3>
			<div class="m-0">
				{#each languages as language, i}
					<span class="mr-8" />
					<div>{languages[i]}</div>
					<ProgressBar value={langprogressions[i]} />
					<div class="m-0">
						<a href="/" class="text-blue-700">Show all untranslated</a>
						<a href="/" class="ml-24 text-blue-700">Show changed in last 7 days</a>
					</div>
				{/each}
			</div>
			<div class="mt-16">
				<Pagination totalItems={languages.length} pageSize={5} />
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
