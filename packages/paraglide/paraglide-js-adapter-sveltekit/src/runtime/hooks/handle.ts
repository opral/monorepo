import type { Handle } from "@sveltejs/kit"
import { getPathInfo } from "../utils/get-path-info.js"
import { base } from "$app/paths"
import type { I18nConfig } from "../adapter.js"

export type HandleOptions = {
	/**
	 * Which placeholder to find and replace with the language tag.
	 * Use this placeholder as the lang atrribute in your `src/app.html` file.
	 *
	 *
	 * @default "%paraglide.lang%"
	 *
	 * @example
	 * ```html
	 * <!-- src/app.html -->
	 * <html lang="%paraglide.lang%">
	 * ```
	 * ```ts
	 * { langPlaceholder: "%paraglide.lang%" }
	 * ```
	 *
	 */
	langPlaceholder?: string

	/**
	 * Which placeholder to find and replace with the text-direction of the current language.
	 *
	 * @default "%paraglide.dir%"
	 *
	 * @example
	 * ```html
	 * <!-- src/app.html -->
	 * <html dir="%paraglide.dir%">
	 * ```
	 * ```ts
	 * { dirPlaceholder: "%paraglide.dir%" }
	 * ```
	 */
	dirPlaceholder?: string
}

export const createHandle = <T extends string>(
	i18n: I18nConfig<T>,
	options: HandleOptions
): Handle => {
	const langPlaceholder = options.langPlaceholder ?? "%paraglide.lang%"
	const dirPlaceholder = options.dirPlaceholder ?? "%paraglide.dir%"

	return ({ resolve, event }) => {
		const { lang } = getPathInfo(event.url.pathname, {
			availableLanguageTags: i18n.runtime.availableLanguageTags,
			defaultLanguageTag: i18n.defaultLanguageTag,
			base,
		})

		const dir = i18n.dir[lang as T] ?? "ltr"

		event.locals.paraglide = {
			lang,
			dir,
		}

		return resolve(event, {
			transformPageChunk({ html, done }) {
				if (!done) return html
				return html.replace(langPlaceholder, lang).replace(dirPlaceholder, dir)
			},
		})
	}
}

declare global {
	namespace App {
		interface Locals {
			paraglide: {
				lang: string
				dir: "ltr" | "rtl"
			}
		}
	}
}