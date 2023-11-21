<script lang="ts">
  import { setLanguageTag, languageTag } from "../../paraglide/runtime";
  import * as m from "../../paraglide/messages"
</script>
  
<p>{m.greeting({ name: "Samuel", count: 5 })}</p>
<p>{m.currentLanguageTag({ languageTag: languageTag() })}</p>
<button on:click={() => setLanguageTag("de")}>change language to "de"</button>
<button on:click={() => setLanguageTag("en")}>change language to "en"</button>

