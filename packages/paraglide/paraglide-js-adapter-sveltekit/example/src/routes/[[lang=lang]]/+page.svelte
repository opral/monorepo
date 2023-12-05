<script lang="ts">
	import { availableLanguageTags, languageTag } from "$paraglide/runtime.js"
	import { goto } from "$lib/ParaglideJS.svelte"
	import * as m from "$paraglide/messages.js"
</script>

<p>{m.greeting({ name: "Samuel", count: 5 })}</p>
<p>{m.currentLanguageTag({ languageTag: languageTag() })}</p>

<a href="/about">{m.about()}</a>

<br/>


<br/>

<!-- Navigation with languageTag -->
{#each availableLanguageTags as lang}
	<a href="/" hreflang={lang}>
		{m.change_language_to({ languageTag: lang })}
	</a>
	<br />
{/each}

<!-- Programmatic Navigation with goto -->
<select on:change={(e)=>{
	goto("/", { 
		//@ts-ignore
		language: e.target.value ,
	})
}}>
	{#each availableLanguageTags as lang}
		<option value={lang} selected={lang === languageTag()}>{lang}</option>
	{/each}
</select>

<br/>

<!-- This path is excluded from being transalted in `vite.config.js` -->
<a href="/not-translated">Not Translated</a>



<form action="/">
	<input type="text" name="test" />
	<button formaction="/test">submit</button>
</form>