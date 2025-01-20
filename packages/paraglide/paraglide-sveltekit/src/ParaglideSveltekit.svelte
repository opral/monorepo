<script lang="ts">
	import type { Runtime } from "@inlang/paraglide-js";
	// @ts-expect-error - sveltekit runtime variable
	import { browser } from "$app/environment"

	/**
	 * Component props interface using Svelte 5's $props
   */
	const { runtime, children }: {
		runtime: Runtime,
		children: any
	} = $props()

	let locale = $state(runtime.getLocale())

	// the effect needs to run before the DOM updates
	// otherwise, the message function will render a
	// stale language (because runtime.setLocale)
	// has not been called yet.
	$effect.pre(() => {
		if (browser) {
      runtime.defineGetLocale(() => {
        return locale
      })
			runtime.defineSetLocale((newLocale) => {
				locale = newLocale
				document.documentElement.lang = newLocale;
			})
		}
	});
</script>

<!-- Trigger a Re-Render whenever the language changes -->
{#key locale}
	{@render children?.()}
{/key}
