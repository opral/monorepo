<script lang="ts">
	import { clone, push } from '$lib/services/git/';
	import http from 'isomorphic-git/http/web';
	import { fs } from '$lib/stores/filesystem';
	import { page } from '$app/stores';
	import { searchParams } from './_store';
	import git from 'isomorphic-git';
	import { user } from '$lib/stores/user';

	// ugly stitching together of paths
	// let breadcrumbs: () => { name: string; href: string; isCurrentPage: boolean }[];
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

	function onAuth() {
		const token = import.meta.env.VITE_GITHUB_TOKEN as string;
		return {
			username: token
		};
	}

	// wrapping clone in a variable to make the function call none-reactive.
	//
	// If the $page.params.uri changes (new search params etc.), the repo should not be cloned again.
	let cloning = clone({
		fs: fs.callbackBased,
		dir: '/',
		http,
		onAuth,
		url: $page.params.uri,
		corsProxy: 'https://my-app-hbv9a.ondigitalocean.app/'
	});

	$: unpushedChanges = async () => {
		// making unpushedChanges reactive by referencing $fs.
		// can't use (the promised based $fs) directly because the `git`
		// object crashes otherwise.
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const _ = $fs;
		const oneWeekAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
		const all = await git.log({
			fs: fs.callbackBased,
			dir: '/',
			ref: 'HEAD',
			since: oneWeekAgo
		});
		const pushed = await git.log({
			fs: fs.callbackBased,
			dir: '/',
			ref: 'origin',
			since: oneWeekAgo
		});
		const unpushed = all.filter(
			(commit) => !pushed.some((pushedCommit) => commit.oid === pushedCommit.oid)
		);
		return unpushed;
	};

	let submitButtonLoading = false;

	async function handleSubmitForReview(): Promise<void> {
		submitButtonLoading = true;
		try {
			(
				await push({
					fs: fs.callbackBased,
					http,
					dir: '/',
					author: $user,
					remote: 'origin',
					url: $page.params.uri,
					corsProxy: 'https://my-app-hbv9a.ondigitalocean.app/',
					onAuth
				})
			).unwrap();
			// refresh the states
			fs.refresh();
		} catch (error) {
			console.error(error);
			alert((error as Error).message);
		} finally {
			submitButtonLoading = false;
		}
	}
</script>

<!-- BREADCRUMBS START -->
<div class="border px-4 py-2 rounded">
	<sl-breadcrumb>
		<!-- repository octicon -->
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-6 h-6 pr-2"
			><path
				fill-rule="evenodd"
				d="M3 2.75A2.75 2.75 0 015.75 0h14.5a.75.75 0 01.75.75v20.5a.75.75 0 01-.75.75h-6a.75.75 0 010-1.5h5.25v-4H6A1.5 1.5 0 004.5 18v.75c0 .716.43 1.334 1.05 1.605a.75.75 0 01-.6 1.374A3.25 3.25 0 013 18.75v-16zM19.5 1.5V15H6c-.546 0-1.059.146-1.5.401V2.75c0-.69.56-1.25 1.25-1.25H19.5z"
			/><path
				d="M7 18.25a.25.25 0 01.25-.25h5a.25.25 0 01.25.25v5.01a.25.25 0 01-.397.201l-2.206-1.604a.25.25 0 00-.294 0L7.397 23.46a.25.25 0 01-.397-.2v-5.01z"
			/></svg
		>
		{#each breadcrumbs() as breadcrumb}
			<sl-breadcrumb-item href={breadcrumb.href}>{breadcrumb.name}</sl-breadcrumb-item>
		{/each}
	</sl-breadcrumb>
</div>

<!-- BREADCRUMBS END -->

{#await cloning}
	<div
		class="absolute inset-0 w-full h-full flex flex-col items-center justify-center backdrop-blur z-50"
	>
		<h1 class="display-md">Cloning repository...</h1>
	</div>
	<!-- show content while loading (to avoid snapping elements) -->
	<!-- <slot /> -->
{:then result}
	{#if result.isErr}
		<div class="alert alert-error">
			<h1 class="alert-title">Something went wrong.</h1>
			<p class="alert-body">{result.error.message}</p>
		</div>
	{:else}
		{#await unpushedChanges() then unpushedChanges}
			{#if unpushedChanges.length > 0}
				<sl-alert open variant="success">
					<sl-icon slot="icon" name="info-circle" />
					<div class="flex items-center">
						<div class="w-full">
							<h3 class="title-md mb-1">{unpushedChanges.length} outstanding changes:</h3>
							<ol>
								{#each unpushedChanges.slice(0, 3) as change}
									<li class="body-md">- {change.commit.message}</li>
								{/each}
								{#if unpushedChanges.length > 3}
									<li class="body-md">...</li>
								{/if}
							</ol>
						</div>
						<sl-button
							size="small"
							variant="success"
							loading={submitButtonLoading}
							on:click={handleSubmitForReview}
						>
							Submit for review
						</sl-button>
					</div>
				</sl-alert>
			{/if}
		{/await}
		<slot />
	{/if}
{/await}
