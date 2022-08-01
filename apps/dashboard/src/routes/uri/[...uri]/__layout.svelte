<script lang="ts">
	import InlineLoadingWrapper from '$lib/components/InlineLoadingWrapper.svelte';
	import { t } from '$lib/services/i18n';
	import http from 'isomorphic-git/http/web';
	import { fs } from '$lib/stores/filesystem';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Breadcrumb, BreadcrumbItem } from 'carbon-components-svelte';
	import { searchParams } from '$lib/stores/routes/uriStores';
	import GitStatus from '$lib/components/GitStatus.svelte';
	import { clone } from '$lib/services/git/index';

	let inlineLoadingStatus: InlineLoadingWrapper['$$prop_def']['status'] = 'inactive';

	let isLoading = true;

	async function cloneRepository(): Promise<void> {
		inlineLoadingStatus = 'active';
		const result = await clone({
			fs: fs.callbackBased,
			dir: '/',
			http,
			url: $page.params.uri,
			corsProxy: 'https://cors.isomorphic-git.org'
		});
		if (result.isErr) {
			inlineLoadingStatus = 'error';
			alert(result.error);
		} else {
			inlineLoadingStatus = 'finished';
		}
		fs.refresh();
	}

	onMount(async () => {
		await cloneRepository();
		isLoading = false;
	});
</script>

<Breadcrumb class="mb-1">
	<BreadcrumbItem href="/uri/{$page.params.uri}" isCurrentPage={$searchParams.dir === '/'}>
		<h2>
			<!-- the title. consisting of the last two paths (/) of the uri -->
			{$page.params.uri.split('/').slice(-2).join('/')}
		</h2>
	</BreadcrumbItem>
	<!-- slice = skip slashes when splitting path -->
	{#each $searchParams.dir.split('/').slice(1, -1) as subpath, i}
		<!-- 
			rootpath = the path(s) "above" the subpath
			.slice(1) to remove prefixed slash as in the each loop above
		-->
		{@const rootpath = $searchParams.dir.split('/').slice(1).slice(0, i).join('/')}
		<!-- dir = if roothpath exists ? merge paths : else only take subpath -->
		{@const dir = rootpath ? `/${rootpath}/${subpath}/` : `/${subpath}/`}
		<!-- isCurrentPage = ugly slicing of slashes -->
		<BreadcrumbItem
			href="/uri/{$page.params.uri}?dir={dir}"
			isCurrentPage={$searchParams.dir.slice(
				$searchParams.dir.slice(0, -1).lastIndexOf('/') + 1,
				-1
			) === subpath}
		>
			<h2>
				{subpath}
			</h2>
		</BreadcrumbItem>
	{/each}
</Breadcrumb>
<br />

{#if isLoading}
	<InlineLoadingWrapper
		status={inlineLoadingStatus}
		activeDescription={$t('working-on-it')}
		finishedDescription={$t('generic.success')}
	/>
{:else}
	<GitStatus />
	<slot />
{/if}
