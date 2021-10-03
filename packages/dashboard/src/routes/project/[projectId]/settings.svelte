<script lang="ts">
	import { projectStore } from '$lib/stores/projectStore';
	import { CodeSnippet } from 'carbon-components-svelte';
</script>

<row class="space-x-4 items-center">
	<p>Project ID:</p>
	<CodeSnippet>{$projectStore.data?.project.id}</CodeSnippet>
</row>
