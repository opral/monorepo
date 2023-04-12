
<script lang="ts">
	import { getI18nContext } from '../inlang.js'
	import { clientFn } from '../utils/client.js'

	const { i } = getI18nContext()

	console.info('Component.svelte', i('welcome'))

	clientFn()
</script>

<h1>{i('welcome')}</h1>
<p>{@html i('link-to-docs')}</p>
