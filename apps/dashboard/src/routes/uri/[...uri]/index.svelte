<script lang="ts">
	import { Button, ClickableTile, Loading } from 'carbon-components-svelte';
	import Delete16 from 'carbon-icons-svelte/lib/Delete16';
	import Add16 from 'carbon-icons-svelte/lib/Add16';
	import { fs } from '$lib/stores/filesystem';
	import { page } from '$app/stores';
	import { Breadcrumb, BreadcrumbItem } from 'carbon-components-svelte';

	$: path = $page.url.searchParams.get('path') ?? '';

	$: directories = async () => {
		const paths = await $fs.readdir(path === '' ? '/' : path);
		return paths.filter(async (path) => {
			const stat = await $fs.stat(path);
			// console.log({ isDir: stat.isDirectory(), isFile: stat.isFile() });
			// return stat.isDirectory();
			return true;
		});
	};
</script>

{#await directories()}
	<Loading />
{:then paths}
	<!-- filter = only show directories -->
	{#each paths as _path}
		<ClickableTile href={`/uri/${$page.params.uri}?path=${path + '/' + _path}`}>
			{_path}
		</ClickableTile>
	{/each}
{/await}
