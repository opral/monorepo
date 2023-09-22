
<script lang="ts">
	import { getRuntimeFromContext } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/reactive'
	import { clientFn } from '../utils/client.js'

	const { i } = getRuntimeFromContext()

	console.info('Component.svelte', $i('welcome'))

	clientFn()
</script>

<h1>{$i('welcome')}</h1>
<p>{@html $i('link-to-docs')}</p>
