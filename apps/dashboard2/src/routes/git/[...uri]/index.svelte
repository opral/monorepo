<script lang="ts">
	import { page } from '$app/stores';
	import { searchParams, resources } from './_store';
	import { fs, normalize } from '$lib/stores/filesystem';

	$: directories = async () => {
		const paths = await $fs.readdir($searchParams.dir);
		// not using filter because async
		const dirs: string[] = [];
		for (const subpath of paths) {
			// skipping .dot files and directories
			if (subpath.at(0) === '.') {
				continue;
			}
			const stat = await $fs.stat(normalize($searchParams.dir + subpath) + '/');
			if (stat.isDirectory()) {
				dirs.push(subpath);
			}
		}
		return dirs;
	};

	// // check whether directory contains the inlang config
	// $: async () => {
	// 	const paths = await $fs.readdir(path);
	// 	if (paths.includes('inlang.config.json')) {
	// 		inlangConfigFound = true;
	// 	} else {
	// 		inlangConfigFound = false;
	// 	}
	// };
</script>

{#await directories()}
	<div class="spinner-border" role="status">
		<span class="visually-hidden">Loading...</span>
	</div>
{:then paths}
	{#if $resources}
		<div class="alert alert-info" role="alert">
			<strong>Inlang config found.</strong>
			<!-- ugly ugly workaround to set a search parameter -->
			<a
				href={$page.url.pathname +
					'/messages?' +
					decodeURIComponent($page.url.searchParams.toString())}
			>
				Open editor
			</a>
		</div>
	{/if}
	<!-- filter = only show directories -->
	<h3>Select a directory:</h3>
	<p class="text-gray-600 text-sm">
		The directory must contain an <code>inlang.config.json</code> to open and edit messages.
	</p>
	<br />
	{#each paths as subpath}
		<ul class="nav column">
			<li class="nav-item">
				<!-- hrefs must have a trailing slash!  -->
				<a href={`/uri/${$page.params.uri}?dir=${$searchParams.dir + subpath}/`} class="nav-link">
					{subpath}
				</a>
			</li>
		</ul>
	{/each}
{/await}
