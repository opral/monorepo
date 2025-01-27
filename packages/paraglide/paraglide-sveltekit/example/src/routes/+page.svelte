<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { setLocale } from '$lib/paraglide/runtime';

	let count = $state(0)
</script>

<h1>{m.welcome()}</h1>

<button onclick={() => setLocale('en')}>Set locale to "en"</button>
<button onclick={() => setLocale('de')}>Set locale to "de"</button>

<p>Count is {count}</p>
<button onclick={() => count += 1}>Increment count</button>