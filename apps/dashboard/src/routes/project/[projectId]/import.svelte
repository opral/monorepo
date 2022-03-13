<script lang="ts">
	import InlineLoadingWrapper from '$lib/components/InlineLoadingWrapper.svelte';
	import SerializedResource from '$lib/components/SerializedResource.svelte';
	import { database } from '$lib/services/database';
	import { projectStore } from '$lib/stores/projectStore';
	import {
		Converter,
		converters,
		parseResources,
		serializeResources
	} from '@inlang/fluent-format-converters';
	import { LanguageCode, Result } from '@inlang/utils';
	import { definitions } from '@inlang/database';
	import { Resources } from '@inlang/fluent-ast';
	import {
		Button,
		InlineNotification,
		NotificationActionButton,
		TextArea
	} from 'carbon-components-svelte';
	import DocumentImport32 from 'carbon-icons-svelte/lib/DocumentImport32';
	import { t } from '$lib/services/i18n';

	let selectedLanguageCode: LanguageCode = $projectStore.data?.project.base_language_code ?? 'en';
	let importTextField = '';
	let selectedConverter: Converter = converters.fluent;

	const resources = $projectStore.data?.resources ?? new Resources({ resources: {} });

	$: serializedAsFluent = (() => {
		const parsed = parseResources({
			converter: selectedConverter,
			files: [{ languageCode: selectedLanguageCode, data: importTextField }]
		});
		if (parsed.isErr) {
			return Result.err(parsed.error);
		}
		const serializedAsFluent = serializeResources({
			converter: converters.fluent,
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
	<h1 class="mb-1">{$t('generic.import')}</h1>
	<p>{$t('info.import')}</p>
	<InlineNotification
		hideCloseButton
		kind="warning"
		title={$t('warning.import-overwrite')}
		subtitle={$t('warning.no-merge-yet')}
	>
		<NotificationActionButton slot="actions">
			<a href="https://github.com/inlang/inlang/discussions/101" target="_blank"
				>{$t('learn-more')}</a
			>
		</NotificationActionButton>
	</InlineNotification>
	<br />
	<SerializedResource bind:selectedLanguageCode bind:selectedConverter {resources}>
		<TextArea
			slot="code-field"
			placeholder={$t('paste-file-here')}
			style="height: 60vh;"
			labelText={$t('generic.file')}
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
					{$t('generic.import')}
				</Button>
			{:else}
				<InlineLoadingWrapper
					activeDescription={$t('loading.importing-translations')}
					finishedDescription={$t('loading.importing-translations-finished')}
					bind:status={loadingStatus}
				/>
			{/if}
		</div>
	</SerializedResource>
{/if}
