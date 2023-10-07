<script>
  import { changeLanguageTag, languageTag } from '@inlang/paraglide-js';
  import * as m from "@inlang/paraglide-js/messages/en"
</script>


<p>{m.greeting({ name: "Samuel", count: 5 })}</p>
<p>{m.currentLanguageTag({languageTag})}</p>
<button on:click={() => changeLanguageTag("de")}>change language to "de"</button>
<button on:click={() => changeLanguageTag("en")}>change language to "en"</button>

