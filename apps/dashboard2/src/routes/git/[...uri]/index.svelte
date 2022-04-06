<script lang="ts">
	import { page } from '$app/stores';
	import { searchParams, resources } from './_store';
	import { fs, normalize } from '$lib/stores/filesystem';
	import { icon } from '$lib/utils/icon';

	$: fileExplorer = async () => {
		const paths = await $fs.readdir($searchParams.dir);
		// not using filter because async
		const dirs = [];
		for (const subpath of paths) {
			// skipping .dot files and directories
			if (subpath.at(0) === '.') {
				continue;
			}
			const stat = await $fs.stat(normalize($searchParams.dir + subpath) + '/');
			// if (stat.isDirectory()) {
			dirs.push({ path: subpath, isDirectory: stat.isDirectory() });
			// }
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

{#if $resources}
	<div class="alert alert-success border">
		<h3 class="alert-title">
			<i class="{icon('success')} mr-2" />
			Found inlang.config.json file.
		</h3>
		<div class="alert-actions">
			<a
				class="button button-sm button-success"
				href={$page.url.pathname +
					'/messages?' +
					decodeURIComponent($page.url.searchParams.toString())}
			>
				<i class="{icon('box-arrow-up-right')} mr-2" />
				Open editor
			</a>
		</div>
	</div>
{:else}
	<div class="alert alert-info border">
		<h3 class="alert-title">
			<i class="{icon('info')} mr-2" />
			Open a directory that contains an inlang.config.json file.
		</h3>
		<p class="title-body">TODO: add description</p>
	</div>
{/if}
<!-- filter = only show directories -->
<ol class="bg-surface-100 text-on-surface rounded border divide-y">
	<h3 class="title-md px-4 py-3 bg-surface-200">File explorer</h3>
	{#await fileExplorer() then paths}
		{#each paths as { path, isDirectory }}
			<li class="px-4 py-2">
				{#if isDirectory}
					<a
						class="link"
						sveltekit:prefetch
						href={`/git/${$page.params.uri}?dir=${$searchParams.dir + path}/`}
					>
						<i class="{icon('folder-fill')} mr-2" />
						{path}
					</a>
				{:else}
					<i class="{icon('file-text-fill')} mr-2" />
					{path}
					{#if path.includes('inlang.config.json')}
						<span class="label-md align-end bg-success-container p-1 mx-2 rounded">
							Configuration found
						</span>
					{/if}
				{/if}
			</li>
		{/each}
	{/await}
</ol>
