<script lang="ts">
	import { Modal, TextInput } from 'carbon-components-svelte';
	import { Result } from '@inlang/result';
	import InlineLoadingWrapper from '../InlineLoadingWrapper.svelte';
	import { withUxTimeout } from '$lib/utils/withUxTimeout';
	import { autoCloseModalOnSuccessTimeout } from '$lib/utils/timeouts';
	import { t } from '$lib/services/i18n';

	/**
	 * @param heading Header of the modal
	 * @param danger If true, the confirm button will be red
	 * @param requireTypingOf when defined, the user must enter the string before being able to proceed.
	 * @param onConfirm is a promise to show loading indicators and returns a result to either show success or an error
	 */
	export function show(args: {
		heading: string;
		message: string;
		danger: boolean;
		requireTypingOf?: string;
		onConfirm: () => Promise<Result<void, Error>>;
	}): void {
		inlineLoadingStatus = 'inactive';
		heading = args.heading;
		message = args.message;
		danger = args.danger;
		requireTypingOf = args.requireTypingOf;
		nameOfEntityInput = '';
		onConfirm = args.onConfirm;
		open = true;
	}

	export function hide(): void {
		open = false;
	}

	let danger = false;

	let onConfirm: () => Promise<Result<void, Error>>;

	$: primaryButtonDisabled =
		inlineLoadingStatus === 'active' || inlineLoadingStatus === 'finished'
			? true
			: requireTypingOf
			? nameOfEntityInput !== requireTypingOf
			: false;

	let requireTypingOf: string | undefined;

	let open = false;

	let heading: string;

	let nameOfEntityInput = '';

	let message: string;

	let inlineLoadingStatus: InlineLoadingWrapper['$$prop_def']['status'] = 'inactive';

	async function handleConfirm(): Promise<void> {
		inlineLoadingStatus = 'active';
		const result = await withUxTimeout(onConfirm);
		if (result.isErr) {
			inlineLoadingStatus = 'error';
			alert(result.error);
			return;
		}
		inlineLoadingStatus = 'finished';
		// automatically closing the modal but leave time to
		// let the user read the result status of the action
		setTimeout(() => {
			open = false;
		}, autoCloseModalOnSuccessTimeout);
	}
</script>

<!-- Set Default Language Modal -->
<Modal
	bind:danger
	bind:open
	modalHeading={heading}
	primaryButtonText={inlineLoadingStatus !== 'error' ? $t('generic.confirm') : $t('try-again')}
	{primaryButtonDisabled}
	secondaryButtonText="{$t('generic.cancel')}}"
	on:click:button--primary={handleConfirm}
	on:click:button--secondary={() => {
		open = false;
	}}
>
	<p>{message}</p>
	<br />
	{#if requireTypingOf}
		<p class="pb-1 text-xs">{($t('confirm-with-typing'), { requireTypingOf })}</p>
		<TextInput bind:value={nameOfEntityInput} />
		<br />
	{/if}
	{#if inlineLoadingStatus !== 'inactive'}
		<InlineLoadingWrapper
			status={inlineLoadingStatus}
			activeDescription={$t('working-on-it')}
			finishedDescription={$t('generic.success')}
		/>
	{/if}
</Modal>
