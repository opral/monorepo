<script lang="ts">
  import { changeLanguageTag, languageTag, onChangeLanguageTag } from '@inlang/paraglide-js';
  import * as m from "@inlang/paraglide-js/messages"
  import { getContext, setContext } from "svelte"
	import type { PageData } from './$types';
  import { page } from '$app/stores'
	
  setContext("languageTag", $page.params.lang)
  onChangeLanguageTag((newLanguageTag) => {
    window.location.href = `/${newLanguageTag}`
  });
</script>


<p>{m.greeting({ name: "Samuel", count: 5 })}</p>
<p>{m.currentLanguageTag({ languageTag: languageTag() })}</p>
<button on:click={() => changeLanguageTag("de")}>change language to "de"</button>
<button on:click={() => changeLanguageTag("en")}>change language to "en"</button>

