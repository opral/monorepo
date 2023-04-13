
<script lang="ts">
	import { getInlangContext } from '@inlang/sdk-js/adapter-sveltekit/client'
	import { clientFn } from '../utils/client.js'

	const { i } = getInlangContext()

	console.info('Component.svelte', $i('welcome'))

	clientFn()
</script>

<h1>{$i('welcome')}</h1>
<p>{@html $i('link-to-docs')}</p>
