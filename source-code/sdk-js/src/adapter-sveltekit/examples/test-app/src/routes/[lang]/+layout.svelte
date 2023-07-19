<script>
	import { navigating } from '$app/stores'
	import { languageTag, languageTags } from "@inlang/sdk-js"
	export let data

	$: console.log(1, data.languageTag);
	$: console.log(2, languageTag);
	$: console.log(3, $navigating);
</script>

{languageTags}

<slot />
