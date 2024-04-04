<script>
	import { navigating } from '$app/stores'
	import { language, languages } from "@inlang/sdk-js"
	export let data

	$: console.info(1, data.language);
	$: console.info(2, language);
	$: console.info(3, $navigating);
</script>

{languages}

<slot />
