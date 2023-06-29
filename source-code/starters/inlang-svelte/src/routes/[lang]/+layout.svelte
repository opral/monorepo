<script>
	import { navigating } from '$app/stores'
	import { language, languages } from "@inlang/sdk-js"
	export let data

	$: console.log(1, data.language);
	$: console.log(2, language);
	$: console.log(3, $navigating);
</script>

{languages}

<slot />
