<script>
    import * as m from "$paraglide/messages.js";
    import { getLocale } from "$paraglide/runtime.js";

    console.log("locale", getLocale())

    let count = 0;
</script>

<button on:click={() => count += 1}>
    {m.count({  count })}
</button>