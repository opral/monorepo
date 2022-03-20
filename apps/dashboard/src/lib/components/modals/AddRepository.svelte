<script lang="ts">
	import { Modal, TextInput } from 'carbon-components-svelte';
	import InlineLoadingWrapper from '../InlineLoadingWrapper.svelte';
	import { withUxTimeout } from '$lib/utils/withUxTimeout';
	import { autoCloseModalOnSuccessTimeout } from '$lib/utils/timeouts';
	import { t } from '$lib/services/i18n';
	import git from 'isomorphic-git';
	import http from 'isomorphic-git/http/web';
	import { fs } from '$lib/stores/filesystem';

	export function show(args: { onSuccess: () => Promise<unknown> }): void {
		onSuccess = args.onSuccess;
		open = true;
	}

	export function hide(): void {
		open = false;
	}

	let danger = false;

	let onSuccess: () => Promise<unknown>;

	$: primaryButtonDisabled =
		inlineLoadingStatus === 'active' || inlineLoadingStatus === 'finished' ? true : false;

	let open = false;

	let url = '';

	let inlineLoadingStatus: InlineLoadingWrapper['$$prop_def']['status'] = 'inactive';

	async function handleClone(): Promise<void> {
		inlineLoadingStatus = 'active';
		try {
			// replacing slashes with | to make the directory
			const dir = `/${url.replaceAll('/', '|')}`;
			await $fs.mkdir(dir);
			// try {
			// 	// see whether the directory exists
			// 	await fs.readdir(dir);
			// } catch {
			// 	await fs.mkdir(dir);
			// }
			await git.clone({
				fs: $fs,
				http,
				dir,
				url,
				corsProxy: 'https://cors.isomorphic-git.org'
			});
			fs.refresh();
			await withUxTimeout(onSuccess);
			inlineLoadingStatus = 'finished';
			// automatically closing the modal but leave time to
			// let the user read the result status of the action
			setTimeout(() => {
				open = false;
			}, autoCloseModalOnSuccessTimeout);
		} catch (error) {
			inlineLoadingStatus = 'error';
			alert(error);
		}
	}
</script>

<!-- Set Default Language Modal -->
<Modal
	bind:danger
	bind:open
	modalHeading={'Add repository'}
	primaryButtonText={inlineLoadingStatus !== 'error' ? $t('generic.add') : $t('try-again')}
	{primaryButtonDisabled}
	secondaryButtonText="{$t('generic.cancel')}}"
	on:click:button--primary={handleClone}
	on:click:button--secondary={() => {
		open = false;
	}}
>
	<p>Lorem ipsum</p>
	<TextInput bind:value={url} />
	<br />
	{#if inlineLoadingStatus !== 'inactive'}
		<InlineLoadingWrapper
			status={inlineLoadingStatus}
			activeDescription={$t('working-on-it')}
			finishedDescription={$t('generic.success')}
		/>
	{/if}
</Modal>
