<script lang="ts">
	import SerializedResource from '$lib/components/SerializedResource.svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import { Converter, converters, serializeResources } from '@inlang/fluent-format-converters';
	import { LanguageCode } from '@inlang/utils';
	import { Resources } from '@inlang/fluent-ast';
	import { CodeSnippet, InlineNotification } from 'carbon-components-svelte';
	import { t } from '$lib/services/i18n';
	let selectedLanguageCode: LanguageCode = $projectStore.data?.project.base_language_code ?? 'en';
	let selectedConverter: Converter = converters.fluent;

	const resources = $projectStore.data?.resources ?? new Resources({ resources: {} });

	let serializedResource: () => string;
	$: serializedResource = () => {
		const result = serializeResources({ converter: selectedConverter, resources });
		if (result.isErr) {
			return 'The file could not be serialized.\n' + result.error.message;
		}
		const resource = result.value.find(
			(resource) => resource.languageCode === selectedLanguageCode
		);
		if (resource === undefined || resource.data === '') {
			return `No file for the language "${selectedLanguageCode}" exists.`;
		}
		return resource.data;
	};
</script>

{#if $projectStore.data === undefined || $projectStore.data?.languages.length === 0}
	<InlineNotification title="Error fetching data" />
{:else}
	<h1 class="mb-1">{$t('generic.export')}</h1>
	<p>{$t('info.export')}</p>
	<br />
	<SerializedResource bind:selectedLanguageCode bind:selectedConverter {resources}>
		<div slot="code-field" style="height: 60vh; overflow:auto;">
			<p class="text-xs text-gray-600 mb-2">{$t('generic.file')}</p>
			<CodeSnippet code={serializedResource()} type="multi" />
		</div>
	</SerializedResource>
{/if}
