import getLanguage from "$paraglide-adapter-sveltekit:get-language"
import { sourceLanguageTag } from "$paraglide-adapter-sveltekit:runtime"
import type { Handle } from "@sveltejs/kit"

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
 * @returns A SvelteKit handle hook
 */
export const injectLangAttribute = (placeholder: string): Handle => {
	return async ({ resolve, event }) => {
		const lang = getLanguage(event.url) ?? sourceLanguageTag
		return await resolve(event, {
			transformPageChunk({ html, done }) {
				if (done) return html.replace(placeholder, lang)
				return html
			},
		})
	}
}
