<script>
  import { setLanguageTag, languageTag } from '@inlang/paraglide-js/svelte-example';
  import * as m from "@inlang/paraglide-js/svelte-example/messages"
	import ParaglideSvelte from './ParaglideJsProvider.svelte'
</script>

<ParaglideSvelte>

  <p>{m.greeting({ name: "Samuel", count: 5 })}</p>
  <p>{m.currentLanguageTag({languageTag})}</p>
  <button on:click={() => setLanguageTag("de")}>change language to "de"</button>
  <button on:click={() => setLanguageTag("en")}>change language to "en"</button>

</ParaglideSvelte>