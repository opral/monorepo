<script lang="ts">
    let disabled = false
</script>

<in-button class="button-primary" {disabled} on:click={() => {
    disabled = !disabled
}}>Click me</in-button>

<p>state is {disabled}</p>