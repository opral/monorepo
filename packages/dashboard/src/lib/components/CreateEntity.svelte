<script>
	import { Button } from 'carbon-components-svelte';
	import { Search } from 'carbon-components-svelte';
	import { Pagination } from 'carbon-components-svelte';

	import { Tag } from 'carbon-components-svelte';

	export let title = '';
	export let description = '';
	export let name = '';

	// TODO
	function goToCreatePage() {
		// go to create an organisation or project page
		if (name == 'organization') {
			// go to create organisation page
		} else if (name == 'project') {
			// go to create project page
		}
	}
	function showMore() {
		// show more information about the selected organisation or project
	}
	// function prev() {
	// go to prev slide of organisations
	// }
	// function next() {
	// go to next slide of organisations
	// }
</script>

<div class="pl-8 pr-8 pt-8">
	<h1>{title}</h1>
	<p>{description}</p>
</div>

<!-- TODO: implement search through the list of projects/organisations -->
<div class="flex flex-row gap-64 justify-between p-8">
	<Button kind="tertiary" on:click={goToCreatePage}>Create {name}</Button>
	<Search placeholder="Search {name}" />
</div>

<!-- TODO: the projects/organisations should be read from a data file -->
<div class="flex flex-row justify-between pl-8 pr-8 pb-8">
	<!-- <div class="width-restriction gap-6 "> -->
	<div class="flex justify-between items-center gap-6">
		<Tag type="blue">LA</Tag>
		<p>labfrogs</p>
	</div>
	<Button kind="tertiary" on:click={showMore}>More</Button>
</div>

<!-- TODO: make pagination interactible -->
<div class="pl-8 pr-8">
	<Pagination totalItems={102} page={4} />
</div>
