<script lang="ts">
	import InlineLoadingWrapper from '$lib/components/InlineLoadingWrapper.svelte';
	import SerializedResource from '$lib/components/SerializedResource.svelte';
	import { database } from '$lib/services/database';
	import { projectStore } from '$lib/stores/projectStore';
	import { AdapterInterface, adapters, parseResources, serializeResources } from '@inlang/adapters';
	import { LanguageCode, Result } from '@inlang/common';
	import { definitions } from '@inlang/database';
	import { Resources } from '@inlang/fluent-syntax';
	import {
		Button,
		InlineNotification,
		NotificationActionButton,
		TextArea
	} from 'carbon-components-svelte';
	import DocumentImport32 from 'carbon-icons-svelte/lib/DocumentImport32';

	let selectedLanguageCode: LanguageCode = $projectStore.data?.project.base_language_code ?? 'en';
	let importTextField = '';
	let selectedAdapter: AdapterInterface = adapters.fluent;

	const resources = $projectStore.data?.resources ?? new Resources({ resources: {} });

	$: serializedAsFluent = (() => {
		const parsed = parseResources({
			adapter: selectedAdapter,
			files: [{ languageCode: selectedLanguageCode, data: importTextField }]
		});
		if (parsed.isErr) {
			return Result.err(parsed.error);
		}
		const serializedAsFluent = serializeResources({
			adapter: adapters.fluent,
			resources: parsed.value
		});
		if (serializedAsFluent.isErr) {
			return Result.err(serializedAsFluent.error);
		}
		return Result.ok(serializedAsFluent.value);
	})();

	// ?. is required because serializedAsFluent is undefined onMount
	$: errorMessage = serializedAsFluent?.isErr ? serializedAsFluent.error.message : '';

	// ?. is required because serializedAsFluent is undefined onMount
	$: hasError = serializedAsFluent?.isErr;

	let loadingStatus: InlineLoadingWrapper['$$prop_def']['status'] = 'inactive';

	async function handleImport(): Promise<void> {
		loadingStatus = 'active';
		if (serializedAsFluent.isErr) {
			alert(serializedAsFluent.error.message);
			return;
		}
		for (const serializedResource of serializedAsFluent.value) {
			const response = await database
				.from<definitions['language']>('language')
				.update({ file: serializedResource.data })
				.match({
					code: serializedResource.languageCode,
					project_id: $projectStore.data?.project.id ?? ''
				});
			if (response.error) {
				alert(response.error.message);
				loadingStatus = 'error';
				break;
			}
		}
		await projectStore.getData({ projectId: $projectStore.data?.project.id ?? '' });
		loadingStatus = 'finished';
	}
</script>

{#if $projectStore.data === undefined || $projectStore.data?.languages.length === 0}
	<InlineNotification title="Error fetching data" />
{:else}
	<h1 class="mb-1">Import</h1>
	<p>Copy and paste your local files into inlang.</p>
	<InlineNotification
		hideCloseButton
		kind="warning"
		title="Importing translations overwrites existent translations."
		subtitle="Inlang has no merge functionality yet."
	>
		<NotificationActionButton slot="actions">
			<a href="https://github.com/inlang/inlang/discussions" target="_blank">Learn more</a>
		</NotificationActionButton>
	</InlineNotification>
	<br />
	<SerializedResource bind:selectedLanguageCode bind:selectedAdapter {resources}>
		<TextArea
			slot="code-field"
			placeholder="Paste your file here"
			style="height: 60vh;"
			labelText="File"
			invalidText={errorMessage}
			invalid={hasError}
			bind:value={importTextField}
		/>
		<div slot="button">
			{#if loadingStatus === 'inactive'}
				<Button
					class="w-full"
					disabled={hasError || importTextField === ''}
					icon={DocumentImport32}
					on:click={handleImport}
				>
					Import
				</Button>
			{:else}
				<InlineLoadingWrapper
					activeDescription="Importing translations..."
					finishedDescription="Translations imported"
					bind:status={loadingStatus}
				/>
			{/if}
		</div>
	</SerializedResource>
{/if}
