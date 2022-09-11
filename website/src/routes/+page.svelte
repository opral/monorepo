<script lang="ts">
	import { Counter } from "@inlang/design-system/svelte";

	let count = 0;
</script>

<h1>Welcome to SvelteKit</h1>
<p>
	Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation
</p>

<button on:click={() => (count += 1)}>increase count</button>

<p>count is {count}</p>

<a href="/some">go to some</a>
