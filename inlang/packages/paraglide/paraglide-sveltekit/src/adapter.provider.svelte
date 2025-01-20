<script>
	import { browser } from "$app/environment"
	import { page } from '$app/state';
	import { goto} from "$app/navigation";
	import * as runtime from "./runtime.js"

	/**
	 * Component props interface using Svelte 5's $props
	 * 
	 * @type {{ children?: any }}
   */
	const { children } = $props()

	let locale = $derived(runtime.getLocaleFromPath(page.url.pathname) ?? runtime.baseLocale)

	  /**
   * Generates a localized path.
   *
   * @param {string} path - The path to localize.
   * @param {Object} [options] - Optional parameters.
   * @param {string} [options.locale] - The locale to use for the path.
   * @returns {string} The localized path.
   */
	const localizedPath = (path, options) => {
		const locale = options?.locale ?? runtime.getLocale()
	
		if (locale === "en"){
			return `/`
		} else {
			return `/${locale}`
		}
	}

	// the effect needs to run before the DOM updates
	// otherwise, the message function will render a
	// stale language (because runtime.setLocale)
	// has not been called yet.
	$effect.pre(() => {
		if (browser) {
      runtime.defineGetLocale(() => locale)
			runtime.defineSetLocale((newLocale) => {
				return goto(localizedPath(page.url.pathname, { locale: newLocale }))
			})
		}
	});
</script>

<!-- Trigger a Re-Render whenever the language changes -->
{#key locale}
	{@render children?.()}
{/key}
