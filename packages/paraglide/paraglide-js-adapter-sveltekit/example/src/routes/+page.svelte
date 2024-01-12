<script>
	import { goto } from "$app/navigation"
	import { availableLanguageTags, languageTag, setLanguageTag } from "$paraglide/runtime.js"
	import * as m from "$paraglide/messages.js"
</script>

<p>{m.greeting({ name: "Samuel", count: 5 })}</p>
<p>{m.currentLanguageTag({ languageTag: languageTag() })}</p>

<a href="/base/about">{m.about()}</a>
<a href="/base/some-subpage">Subpage with redirect</a>

<button on:click={() => goto("/base/about")}> Programmatic About</button>

<br/>


<!-- Programmatic Navigation with goto -->
<select on:change={(e)=>{
	// @ts-ignore
	setLanguageTag(e.target.value)
}}>
	{#each availableLanguageTags as lang}
		<option value={lang} selected={lang === languageTag()}>{lang}</option>
	{/each}
</select>

<br/>

<!-- This path is excluded from being transalted in `vite.config.js` -->
<a href="/base/not-translated">Not Translated</a>

<form action="/base/">
	<input type="text" name="test" />
	<button formaction="/test">submit</button>
</form>