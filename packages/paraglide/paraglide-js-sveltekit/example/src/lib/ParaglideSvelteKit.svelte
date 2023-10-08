<script lang="ts">
  import { setLanguageTag, onSetLanguageTag } from '@inlang/paraglide-js';
  import { getContext, setContext } from "svelte"
	import type { PageData } from './$types';
  import { page } from '$app/stores'
	
  setContext("languageTag", $page.params.lang)

  setLanguageTag(() => getContext("languageTag"))

  // if (import.meta.env.SSR === false){
    onSetLanguageTag((newLanguageTag) => {
      if (import.meta.env.SSR ) return 
      window.location.href = `/${newLanguageTag}`
    });
  // }
  
</script>

<slot></slot>