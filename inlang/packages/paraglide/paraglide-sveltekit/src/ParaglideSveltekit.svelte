<script lang="ts">
	import type { Runtime } from "@inlang/paraglide-js";
	import { browser } from "$app/environment"
	import { page } from '$app/state';
	import { goto} from "$app/navigation";

	/**
	 * Component props interface using Svelte 5's $props
   */
	const { runtime, children }: {
		runtime: Runtime,
		children?: any
	} = $props()

	let locale = $derived(runtime.getLocaleFromPath(page.url.pathname) ?? runtime.baseLocale)

	const localizedPath = (path: string, options?: {
		locale?: string
	}) => {
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
