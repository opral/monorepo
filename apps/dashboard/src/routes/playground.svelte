<script lang="ts">
	import { fs } from '$lib/stores/filesystem';
	import { onMount } from 'svelte';

	onMount(async () => {
		await $fs.mkdir('/example');
		console.log({ stat: await $fs.stat('/example') });
		fs.refresh();
		console.log({ stat: await $fs.stat('/example') });
	});
</script>
