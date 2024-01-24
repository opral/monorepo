<script>
    let isButton = false;
</script>

<input type="checkbox" bind:checked={isButton} />

<svelte:element this={isButton ? 'button' : 'a'} href="/">
    {isButton ? 'Button' : 'Link'}
</svelte:element>