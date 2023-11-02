<script lang="ts">
  import { setLanguageTag, onSetLanguageTag } from '@inlang/paraglide-js/sveltekit';
  import { getContext, setContext } from "svelte"
  import { page } from '$app/stores'
	
  setContext("languageTag", $page.params.lang)

  setLanguageTag(() => getContext("languageTag"))

  if (import.meta.env.SSR === false){
    onSetLanguageTag((newLanguageTag) => {
      window.location.href = `/${newLanguageTag}`
    });
  }
  
</script>

<slot></slot>