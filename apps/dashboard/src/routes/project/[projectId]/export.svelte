<script lang="ts">
	import Adapter from '$lib/components/Adapter.svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import type { definitions } from '@inlang/database';
	import { InlineNotification } from 'carbon-components-svelte';

	const project: definitions['project'] | undefined = $projectStore.data?.project;
	const languages: definitions['language'][] = $projectStore.data?.languages ?? [];
</script>

{#if languages.length === 0 || project === undefined}
	<InlineNotification title="Error fetching data" />
{:else}
	<Adapter
		title="Export"
		details="Select adapter and human language to export"
		{project}
		{languages}
	/>
{/if}
