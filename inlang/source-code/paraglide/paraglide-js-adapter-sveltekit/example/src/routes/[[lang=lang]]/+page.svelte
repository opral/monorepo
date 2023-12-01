<script lang="ts">
	import { availableLanguageTags, languageTag } from "$paraglide/runtime.js"
	import * as m from "$paraglide/messages.js"
</script>

<p>{m.greeting({ name: "Samuel", count: 5 })}</p>
<p>{m.currentLanguageTag({ languageTag: languageTag() })}</p>

<h3>Switch Locales using Links</h3>

{#each availableLanguageTags as lang}
	<a href="/" hreflang={lang}>
		{m.change_language_to({ languageTag: lang })}
	</a
	>
	<br />
{/each}

<a href="/not-translated" data-no-translate >Not translated</a>
<a href="/about">About</a>


<h3>Switch Locales Programatically</h3>