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
	<a href={translatePath("/", lang)} lang="de">change language to "{lang}"</a>
{/each}

<h3>Switch Locales using Buttons</h3>

{#each availableLanguageTags as lang}
  <button on:click={() => goto(translatePath("/", lang))}>change language to "{lang}"</button>
{/each}