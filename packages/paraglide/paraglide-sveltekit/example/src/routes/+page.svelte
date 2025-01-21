<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { setLocale } from '$lib/paraglide/runtime';
</script>

<h1>{m.welcome()}</h1>

<button on:click={() => setLocale('en')}>Set locale to "en"</button>
<button on:click={() => setLocale('de')}>Set locale to "de"</button>
