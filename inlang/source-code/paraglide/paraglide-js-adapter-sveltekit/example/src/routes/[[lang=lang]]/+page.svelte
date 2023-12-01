<script lang="ts">
	import { availableLanguageTags, languageTag } from "../../paraglide/runtime"
	import { translatePath } from "$lib/i18n"
	import { goto } from "$app/navigation"
	import * as m from "../../paraglide/messages"
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

<a href="/about">About</a>
<a href="/abou`t">About</a>

<h3>Switch Locales Programatically</h3>