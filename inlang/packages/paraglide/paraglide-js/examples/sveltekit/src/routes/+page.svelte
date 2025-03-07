<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { localizeHref, setLocale } from '$lib/paraglide/runtime';
</script>

<h1>{m.welcome()}</h1>

<button onclick={() => setLocale('en')}>Set locale to "en"</button>
<button onclick={() => setLocale('de')}>Set locale to "de"</button>

<br />
<br />
<a href={localizeHref('/about', { locale: 'en' })}>go to about in en</a>
<a href={localizeHref('/about', { locale: 'de' })}>go to about in de</a>
