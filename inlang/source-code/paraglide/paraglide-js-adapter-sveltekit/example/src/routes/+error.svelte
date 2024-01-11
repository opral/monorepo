<script>
	import { page } from "$app/stores"
    import * as m from "$paraglide/messages.js"
    import * as runtime from "$paraglide/runtime.js"
    import { ParaglideJS } from "@inlang/paraglide-js-adapter-sveltekit"
</script>

<ParaglideJS {runtime} languageTag="en">
    <h1>{$page.error?.message}</h1>
    <a href="/">{m.home()}</a>
</ParaglideJS>