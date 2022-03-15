<script lang="ts">
	import InlineLoadingWrapper from '$lib/components/InlineLoadingWrapper.svelte';
	import { t } from '$lib/services/i18n';
	import git from 'isomorphic-git';
	import http from 'isomorphic-git/http/web';
	import { fs } from '$lib/stores/filesystem';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let inlineLoadingStatus: InlineLoadingWrapper['$$prop_def']['status'] = 'inactive';

	let isLoading = true;

	async function cloneRepository(): Promise<void> {
		inlineLoadingStatus = 'active';
		try {
			// replacing slashes with | to make the directory
			const dir = `/`;
			// try {
			// 	// see whether the directory exists
			// 	await fs.readdir(dir);
			// } catch {
			// 	await fs.mkdir(dir);
			// }
			await git.clone({
				fs: fs.callbackBased,
				http,
				dir,
				url: $page.params.uri,
				corsProxy: 'https://cors.isomorphic-git.org'
			});
			fs.refresh();
			inlineLoadingStatus = 'finished';
		} catch (error) {
			inlineLoadingStatus = 'error';
			alert(error);
		}
	}

	onMount(async () => {
		await cloneRepository();
		isLoading = false;
	});
</script>

<h1>{$page.params.uri.split('/').slice(-2).join('/')}</h1>
{#if inlineLoadingStatus !== 'inactive'}
	<InlineLoadingWrapper
		status={inlineLoadingStatus}
		activeDescription={$t('working-on-it')}
		finishedDescription={$t('generic.success')}
	/>
{/if}
{#if isLoading === false}
	<slot />
{/if}
