<script lang="ts">
	import { page } from '$app/stores';
	import { projectStore } from '$lib/stores/projectStore';
	import { Loading, InlineNotification, Content } from 'carbon-components-svelte';
	import ProjectSidenav from '$lib/layout/ProjectSidenav.svelte';

	// each time the projectId changes, the project store
	// is updated automatically to either get the data for the project
	// or be "reset" to nothing.
	$: if ($page.params.projectId) {
		projectStore.getData({ projectId: $page.params.projectId });
	} else {
		$projectStore = { data: null, error: null };
	}
</script>

<!-- The layout takes care of handling errors related to the project store -->
{#if $projectStore.data === null && $projectStore.error === null}
	<Loading />
{:else}
	<ProjectSidenav />
	<Content>
		<slot />
		{#if $projectStore.error}
			<InlineNotification title="Error:">{$projectStore.error.message}</InlineNotification>
		{/if}
	</Content>
{/if}
