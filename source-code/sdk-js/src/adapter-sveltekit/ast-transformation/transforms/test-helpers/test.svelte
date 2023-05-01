<script lang="ts" context="module">
</script>

<script lang="ts">
    export let prop: string
    import { i as iStore, language as iLanguage } from '@inlang/sdk-js';
    const blue = iStore;
    const green = iLanguage
    console.log(blue)
</script>

<style>
    .red {
        color: red;
    }
</style>

<h1 class="red">{prop}</h1>
<h1 class="red">{iStore}</h1>
<h1 class="red">{iLanguage}</h1>
