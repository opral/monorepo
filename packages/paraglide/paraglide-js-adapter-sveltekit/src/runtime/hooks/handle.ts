import type { Handle } from "@sveltejs/kit"
import { getPathInfo } from "../utils/get-path-info.js"
import type { Paraglide } from "../runtime.js"
import { base } from "$app/paths"

export type HandleOptions = {
	/**
	 * Which placeholder to find and replace with the language tag.
	 * Use this placeholder as the lang atrribute in your `src/app.html` file.
	 *
	 * @example
	 * ```html
	 * <!-- src/app.html -->
	 * <html lang="%lang%">
	 * ```
	 * ```ts
	 * { langPlaceholder: "%lang%" }
	 * ```
	 *
	 */
	langPlaceholder: string
}

export const createHandle = (runtime: Paraglide<any>, options: HandleOptions): Handle => {
	return ({ resolve, event }) => {
		const { lang } = getPathInfo(event.url.pathname, {
			availableLanguageTags: runtime.availableLanguageTags,
			defaultLanguageTag: runtime.sourceLanguageTag,
			base,
		})

		return resolve(event, {
			transformPageChunk({ html, done }) {
				if (done) return html.replace(options.langPlaceholder, lang)
				return html
			},
		})
	}
}
