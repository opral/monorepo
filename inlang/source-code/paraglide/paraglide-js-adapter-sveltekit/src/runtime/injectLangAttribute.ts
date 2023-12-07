import { sourceLanguageTag } from "$paraglide-adapter-sveltekit:runtime"
import type { Handle, RequestEvent } from "@sveltejs/kit"
import { getLanguageFromURL } from "./getLanguageFromUrl.js"

const defaultLanguageGetter = (event: RequestEvent) => {
	return getLanguageFromURL(event.url) ?? sourceLanguageTag
}

/**
 * A SvelteKit Server hook to set the lang attribute on the html tag correctly.
 *
 * You need to set up the placeholder in `app.html` like this:
 * ```html
 * <html lang="%lang%">
 * ```
 *
 * Then you can use this function like this:
 * ```ts
 * // src/hooks.server.ts
 * import { injectLangAttribute } from "@inlang/paraglide-js-adapter-sveltekit"
 * export const handle = injectLangAttribute("%lang%");
 * ```
 *
 * @param placeholder The placeholder you put in `app.html` for the lang attribute.
 * @param languageGetter A function that takes in a SvelteKit RequestEvent and returns the language to use. By default your routing strategy is used to determine the language from the url.
 * @returns A SvelteKit handle hook
 */
export const injectLangAttribute = (
	placeholder: string,
	languageGetter: (event: RequestEvent) => string = defaultLanguageGetter
): Handle => {
	return async ({ resolve, event }) => {
		const lang = languageGetter(event)
		return await resolve(event, {
			transformPageChunk({ html, done }) {
				if (done) return html.replace(placeholder, lang)
				return html
			},
		})
	}
}
