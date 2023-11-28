<script lang="ts">
	import { browser } from "$app/environment"
	import Header from "$lib/Header.svelte"
	import { getTextDirection } from "$lib/i18n.js"
	import { setLanguageTag } from "$paraglide/runtime"

	export let data
	$: setLanguageTag(data.lang)
  $: textDirection = getTextDirection(data.lang)

  $: if(browser) {
    document.documentElement.dir = textDirection
    document.documentElement.lang = data.lang
  }
</script>

<Header />

{#key data.lang}
	<slot />
{/key}
