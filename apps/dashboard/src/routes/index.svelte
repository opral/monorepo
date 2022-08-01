<script lang="ts">
	import { Button, ClickableTile, Loading } from 'carbon-components-svelte';
	import Delete16 from 'carbon-icons-svelte/lib/Delete16';
	import Add16 from 'carbon-icons-svelte/lib/Add16';
	import AddRepository from '$lib/components/modals/AddRepository.svelte';
	import { fs } from '$lib/stores/filesystem';
	import { page } from '$app/stores';

	// let directories: string[];
	$: directories = $fs.readdir('/');

	let addRepositoryModal: AddRepository;

	async function onAddSuccess(): Promise<unknown> {
		return 'hi';
	}
</script>

<Button on:click={() => addRepositoryModal.show({ onSuccess: onAddSuccess })}>Clone new</Button>

{#await directories}
	<Loading />
{:then _directories}
	{#each _directories as directory}
		<!-- "unescaping" the directory path -->
		{@const path = directory.replaceAll('|', '/')}
		<ClickableTile href={$page.url.pathname + `git/${path}`}>{path}</ClickableTile>
	{/each}
{/await}

<AddRepository bind:this={addRepositoryModal} />
