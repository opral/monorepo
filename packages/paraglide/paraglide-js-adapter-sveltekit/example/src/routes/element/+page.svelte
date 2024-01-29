<script>
	import { base } from "$app/paths"

    let isButton = false;
</script>

<input type="checkbox" bind:checked={isButton} />

<svelte:element this={isButton ? 'button' : 'a'} href="{base}/">
    {isButton ? 'Button' : 'Link'}
</svelte:element>