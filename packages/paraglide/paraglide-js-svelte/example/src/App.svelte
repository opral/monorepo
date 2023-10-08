<script>
  import { setLanguageTag, languageTag } from '@inlang/paraglide-js';
  import * as m from "@inlang/paraglide-js/messages"
	import Layout from './ParaglideJsProvider.svelte'
</script>

<Layout>

  <p>{m.greeting({ name: "Samuel", count: 5 })}</p>
  <p>{m.currentLanguageTag({languageTag})}</p>
  <button on:click={() => setLanguageTag("de")}>change language to "de"</button>
  <button on:click={() => setLanguageTag("en")}>change language to "en"</button>

</Layout>