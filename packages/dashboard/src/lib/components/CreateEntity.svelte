<script>
	import { Button, Row } from 'carbon-components-svelte';
	import { Search } from 'carbon-components-svelte';
	import ArrowRight16 from 'carbon-icons-svelte/lib/ArrowRIght16';
	import ArrowLeft16 from 'carbon-icons-svelte/lib/ArrowLeft16';
	import Number_1 from 'carbon-icons-svelte/lib/Number_132';
	import { Pagination } from 'carbon-components-svelte';

	export let title = '';
	export let description = '';
	export let name = '';

	function handleClick() {
		// go to create an organisation page
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

<div class="flex flex-row gap-64 justify-between" style="padding: 2rem;">
	<Button kind="tertiary" on:click={handleClick}>Create {name}</Button>
	<Search placeholder="Search {name}" />
</div>

<div class="flex flex-row justify-between" style="padding: 1rem;">
	<p>labfrogs</p>
	<Button kind="tertiary" on:click={handleClick}>More</Button>
</div>

<Pagination totalItems={102} page={4} />

<!-- <div class="buttons">
<Button kind="tertiary" iconDescription="Tooltip text" icon={ArrowLeft16} />
<Button kind="tertiary" iconDescription="Tooltip text" icon={Number_1} />
<Button kind="tertiary" iconDescription="Tooltip text" icon={ArrowRight16} />
</div> -->
