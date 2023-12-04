<script lang="ts">
	import { availableLanguageTags, languageTag } from "$paraglide/runtime.js"
	import { goto } from "$paraglide-adapter-sveltekit"
	import * as m from "$paraglide/messages.js"
</script>

<p>{m.greeting({ name: "Samuel", count: 5 })}</p>
<p>{m.currentLanguageTag({ languageTag: languageTag() })}</p>

<a href="/about">{m.about()}</a>

<h3>Switch Locales using Links</h3>

{#each availableLanguageTags as lang}
	<a href="/" hreflang={lang}>
		{m.change_language_to({ languageTag: lang })}
	</a>
	<br />
{/each}

<form action="/">
	<button formaction="/test">submit</button>
</form>

<button on:click={()=>{
	goto("/about", { language: "de" })
}}>Programmatic Navigation</button>

<a href="/not-translated">Not Translated</a>
