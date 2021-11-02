<script context="module">
	import { initI18n } from '../i18n/i18n-svelte';

	export async function load({ page, fetch, session, context }) {
		const locale = 'en';
		await initI18n(locale);

		return {};
	}
</script>

<script>
	import '../app.css';
</script>

<slot />
