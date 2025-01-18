<script>
	import LanguageSwitcher from "./LanguageSwitcher.svelte"
    import { page } from "$app/stores";
    import * as m from "$lib/paraglide/messages.js"
	import { base } from "$app/paths"
</script>
<header>
    <nav>
        <a href="{base}/" aria-current={$page.route.id === "/" ? "page" : undefined}>{m.home()}</a>
        <a href="{base}/about/" aria-current={$page.route.id === "/about" ? "page" : undefined}>{m.about()}</a>
        <a href="{base}/users/1" aria-current={$page.route.id === "/users/[id]" ? "page" : undefined}>{m.users()}</a>
    </nav>
    <span>{$page.url.pathname}</span>
    <LanguageSwitcher />
</header>


<style>
    header {
        display: flex;
        padding: 1em;
        justify-content: space-between;
        border-bottom: 1px solid #e0e0e0;
    }

    nav {
        display: flex;
        gap : 1em;
    }

    a[aria-current="page"] {
        font-weight: bold;
    }
</style>