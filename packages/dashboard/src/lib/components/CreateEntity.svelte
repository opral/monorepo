<script>
	import { Button, Row } from 'carbon-components-svelte';
	import { Search } from 'carbon-components-svelte';
	import ArrowRight16 from 'carbon-icons-svelte/lib/ArrowRIght16';
	import ArrowLeft16 from 'carbon-icons-svelte/lib/ArrowLeft16';
	import Number_1 from 'carbon-icons-svelte/lib/Number_132';
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
	function prev() {
		// go to prev slide of organisations
	}
	function next() {
		// go to next slide of organisations
	}
</script>

<div style="padding: 2rem;">
	<h1>{title}</h1>
	<p>{description}</p>
</div>

<!-- TODO: implement search through the list of projects/organisations -->
<div class="flex flex-row gap-64 justify-between" style="padding: 2rem;">
	<Button kind="tertiary" on:click={goToCreatePage}>Create {name}</Button>
	<Search placeholder="Search {name}" />
</div>

<!-- TODO: the projects/organisations should be read from a data file -->
<div
	class="flex flex-row justify-between"
	style="padding-left: 2rem; padding-right: 2rem;padding-bottom: 2rem;"
>
	<div class="width-restriction gap-6 ">
		<Tag type="blue">LA</Tag>
		<p>labfrogs</p>
	</div>
	<Button kind="tertiary" on:click={showMore}>More</Button>
</div>

<!-- TODO: make pagination interactible -->
<Pagination totalItems={102} page={4} />

<style>
	.width-restriction {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
</style>
