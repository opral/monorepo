<script lang="ts">
	import { page } from '$app/stores';
	import { searchParams, resources } from './_store';
	import { fs, normalize } from '$lib/stores/filesystem';

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
	<sl-alert open variant="success">
		<sl-icon slot="icon" name="info-circle" />
		<h3 class="title-md">Found inlang.config.json file.</h3>
		<sl-button
			class="mt-2"
			href={$page.url.pathname +
				'/in-editor?' +
				decodeURIComponent($page.url.searchParams.toString())}
			size="small"
			variant="success"
		>
			<sl-icon name="box-arrow-up-right" />
			Open editor
		</sl-button>
	</sl-alert>
{:else}
	<sl-alert open>
		<sl-icon slot="icon" name="info-circle" />
		<h3 class="title-md">Open a directory that contains an inlang.config.json file.</h3>
	</sl-alert>
{/if}
<!-- filter = only show directories -->
<ol class="rounded border divide-y">
	<h3 class="title-md px-4 py-3 bg-surface-100">File explorer</h3>
	{#await fileExplorer() then paths}
		{#each paths as { path, isDirectory }}
			<li class="px-4 py-2">
				{#if isDirectory}
					<a
						class="link"
						sveltekit:prefetch
						href={`/git/${$page.params.uri}?dir=${$searchParams.dir + path}/`}
					>
						<sl-icon name="folder-fill" class="mr-2" />
						{path}
					</a>
				{:else}
					<sl-icon name="file-text-fill" class="mr-2" />
					{path}
					{#if path.includes('inlang.config.json')}
						<sl-tag variant="success" size="small" class="ml-2"> Configuration found </sl-tag>
					{/if}
				{/if}
			</li>
		{/each}
	{/await}
</ol>
