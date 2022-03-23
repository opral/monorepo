<script lang="ts">
	import { clone } from './_logic/clone';
	import http from 'isomorphic-git/http/web';
	import { fs } from '$lib/stores/filesystem';
	import { page } from '$app/stores';
	import { searchParams } from './_store';
	import { onMount } from 'svelte';

	// ugly stitching together of paths
	let breadcrumbs: () => { name: string; href: string; isCurrentPage: boolean }[];
	$: breadcrumbs = () => {
		// consists of last two paths (/) of the uri (skipping https:// etc.)
		const respositoryName = $page.params.uri.split('/').slice(-2).join(' ');
		if ($searchParams.dir === '/') {
			return [{ name: respositoryName, href: `/git/${$page.params.uri}`, isCurrentPage: true }];
		}
		const result = [
			{ name: respositoryName, href: `/git/${$page.params.uri}`, isCurrentPage: false }
		];
		for (const [i, subpath] of $searchParams.dir.split('/').slice(1, -1).entries()) {
			// the path(s) "above" the subpath
			// .slice(1) to remove prefixed slash as in the each loop above
			const rootpath = $searchParams.dir.split('/').slice(1).slice(0, i).join('/');
			//  if roothpath exists ? merge paths : else only take subpath
			const dir = rootpath ? `/${rootpath}/${subpath}/` : `/${subpath}/`;
			// ugly slicing of slashes
			let isCurrentPage =
				$searchParams.dir.slice($searchParams.dir.slice(0, -1).lastIndexOf('/') + 1, -1) ===
				subpath;
			result.push({ name: subpath, href: `/git/${$page.params.uri}?dir=${dir}`, isCurrentPage });
		}
		return result;
	};

	// wrapping clone in a variable to make the function call none-reactive.
	//
	// If the $page.params.uri changes (new search params etc.), the repo should not be cloned again.
	let cloning = clone({
		fs: fs.callbackBased,
		dir: '/',
		http,
		url: $page.params.uri,
		corsProxy: 'https://cors.isomorphic-git.org'
	});
</script>

<!-- BREADCRUMBS START -->
<nav aria-label="breadcrumb">
	<ol class="breadcrumb h4">
		{#each breadcrumbs() as breadcrumb}
			<li class="breadcrumb-item" aria-current={breadcrumb.isCurrentPage ? 'page' : undefined}>
				<a href={breadcrumb.href} class="">
					{breadcrumb.name}
				</a>
			</li>
		{/each}
	</ol>
</nav>
<!-- BREADCRUMBS END -->
{#await cloning}
	<div class="my-2">
		<div class="spinner-border spinner-border-sm text-primary me-1" role="status" />
		Loading files...
	</div>
	<!-- show content even when loading (to avoid snapping elements) -->
	<slot />
{:then result}
	{#if result.isErr}
		<div class="alert alert-danger" role="alert">
			<strong>Something went wrong: </strong><br />
			{result.error.message}
		</div>
	{:else}
		<!-- only show content if no error -->
		<slot />
	{/if}
{/await}
