/**
 * Exports stuff that is specific to SvelteKit.
 *
 * The APIs here are not universal across Paraglide JS adapters.
 */
import {
	assertIsLocale,
	overwriteGetLocale,
	deLocalizeUrl,
	extractLocaleFromRequest,
	overwriteGetUrlOrigin,
} from "./runtime.js";

/**
 * @type {import("node:async_hooks").AsyncLocalStorage<{ locale: string, origin: string }>}
 */
let asyncStorage;

/**
 * Defining the getLocale function for SSR.
 *
 * Async storage is used to enable concurrent requests.
 * Each request has a scoped locale during the rendering process.
 */
if (import.meta.env.SSR) {
	overwriteGetLocale(() => assertIsLocale(asyncStorage.getStore()?.locale));
	overwriteGetUrlOrigin(
		() => asyncStorage.getStore()?.origin ?? "http://fallback.com"
	);
}

/**
 * The handle function defines the locale for the incoming request.
 *
 * @example
 *   // src/hooks.ts
 *   import * as paraglide from '$lib/paraglide/adapter';
 *
 *   export const handle = paraglide.handle;
 *
 * @type {import('@sveltejs/kit').Handle}
 */
export const handle = async ({ event, resolve }) => {
	if (asyncStorage === undefined) {
		const { AsyncLocalStorage } = await import("node:async_hooks");
		asyncStorage = new AsyncLocalStorage();
	}

	const locale = extractLocaleFromRequest(event.request);
	const origin = event.url.origin;

	return asyncStorage.run({ locale, origin }, () => resolve(event));
};

/**
 * The reroute handle function de-localizes the path of the incoming request.
 *
 * De-localization of the path is necessary for SvelteKit to render the correct page.
 * SvelteKit has no knowledge of localized paths. De-localization maps a localized path
 * back to the unlocalized path that SvelteKit expects.
 *
 * @example
 *   // src/hooks.ts
 *
 *   import * as paraglide from '$lib/paraglide/adapter';
 *
 *   export const reroute = paraglide.reroute;
 *
 * @type {import('@sveltejs/kit').Reroute}
 */
export const reroute = (request) => {
	return deLocalizeUrl(request.url).pathname;
};
