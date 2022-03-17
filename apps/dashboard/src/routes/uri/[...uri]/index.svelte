<script lang="ts">
	import {
		ClickableTile,
		InlineNotification,
		Loading,
		NotificationActionButton
	} from 'carbon-components-svelte';
	import { fs, normalize } from '$lib/stores/filesystem';
	import { page } from '$app/stores';
	import { searchParams, resources } from '$lib/stores/routes/uriStores';

	$: directories = async () => {
		console.log('rebuild');
		const paths = await $fs.readdir($searchParams.dir);
		console.log({ dir: $searchParams.dir });
		console.log({ paths });
		// not using filter because async
		let dirs: string[] = [];
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
	<Loading />
{:then paths}
	{#if $resources}
		<InlineNotification lowContrast kind="info" title="Inlang config found.">
			<svelte:fragment slot="actions">
				<!-- ugly ugly workaround to set a search parameter -->
				<a
					href={$page.url.pathname +
						'/messages?' +
						decodeURIComponent($page.url.searchParams.toString())}
				>
					<NotificationActionButton>Open editor</NotificationActionButton>
				</a>
			</svelte:fragment>
		</InlineNotification>
	{/if}
	<!-- filter = only show directories -->
	<h3>Select a directory:</h3>
	<p class="text-gray-600 text-sm">
		The directory must contain an <code>inlang.config.json</code> to open and edit messages.
	</p>
	<br />
	{#each paths as subpath}
		<!-- directory hrefs must have a trailing slash!  -->
		<ClickableTile href={`/uri/${$page.params.uri}?dir=${$searchParams.dir + subpath}/`}>
			{subpath}
		</ClickableTile>
	{/each}
{/await}
