<script>
    import * as m from "../paraglide/messages.js";

    let count = 0;
</script>

<button on:click={() => count += 1}>
    {m.count({  count })}
</button>