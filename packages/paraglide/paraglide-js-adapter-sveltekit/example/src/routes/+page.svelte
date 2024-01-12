<script>
	import { goto } from "$app/navigation"
	import { availableLanguageTags, languageTag } from "$paraglide/runtime.js"
	import * as m from "$paraglide/messages.js"
</script>

<p>{m.greeting({ name: "Samuel", count: 5 })}</p>
<p>{m.currentLanguageTag({ languageTag: languageTag() })}</p>

<a href="/base/about">{m.about()}</a>
<br/>
<a href="/base/some-subpage">Subpage with redirect</a>

<br/>
<a href="/base/users/1">{m.users()}</a>


<br/>
<br/>
<button on:click={() => goto("/base/about")}> Programmatic About</button>

<br/>

{#each availableLanguageTags as lang}
    <a href="/base/" hreflang={lang}>
    {m.change_language_to({ languageTag: lang })}
    </a>
    <br />
{/each}


<br/>

<!-- This path is excluded from being transalted in `vite.config.js` -->
<a href="/base/not-translated">Not Translated</a>

<form action="/base/">
	<input type="text" name="test" />
	<button formaction="/test">submit</button>
</form>