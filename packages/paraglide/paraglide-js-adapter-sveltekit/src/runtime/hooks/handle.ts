import type { Handle } from "@sveltejs/kit"
import { getPathInfo } from "../utils/get-path-info.js"
import { base } from "$app/paths"
import type { I18nConfig } from "../adapter.js"
import { dev } from "$app/environment"

/**
 * The default lang attribute string that's in SvelteKit's `src/app.html` file.
 * If this is present on the `<html>` attribute it most likely needs to be replaced.
 */
const SVELTEKIT_DEFAULT_LANG_ATTRIBUTE = 'lang="en"'

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
	 * @default "%paraglide.textDirection%"
	 *
	 * @example
	 * ```html
	 * <!-- src/app.html -->
	 * <html dir="%paraglide.textDirection%">
	 * ```
	 * ```ts
	 * { textDirectionPlaceholder: "%paraglide.textDirection%" }
	 * ```
	 */
	textDirectionPlaceholder?: string
}

export const createHandle = <T extends string>(
	i18n: I18nConfig<T>,
	options: HandleOptions
): Handle => {
	const langPlaceholder = options.langPlaceholder ?? "%paraglide.lang%"
	const dirPlaceholder = options.textDirectionPlaceholder ?? "%paraglide.textDirection%"

	return ({ resolve, event }) => {
		const { lang } = getPathInfo(event.url.pathname, {
			availableLanguageTags: i18n.runtime.availableLanguageTags,
			defaultLanguageTag: i18n.defaultLanguageTag,
			base,
		})

		const textDirection = i18n.textDirection[lang as T] ?? "ltr"

		event.locals.paraglide = {
			lang,
			textDirection,
		}

		return resolve(event, {
			transformPageChunk({ html, done }) {
				if (!done) return html

				// in dev mode, check if the lang attribute hasn't been replaced
				if (
					dev &&
					!html.includes(langPlaceholder) &&
					html.includes(SVELTEKIT_DEFAULT_LANG_ATTRIBUTE)
				) {
					console.warn(
						"It seems like you haven't replaced the `lang` attribute in your `src/app.html` file. \n" +
							`Please replace the \`lang\` attribute with the correct placeholder:"\n\n` +
							` - <html ${SVELTEKIT_DEFAULT_LANG_ATTRIBUTE}>\n` +
							` + <html lang="${langPlaceholder}" dir="${dirPlaceholder}">` +
							`\n\nThis message will not be shown in production.`
					)
				}

				return html.replace(langPlaceholder, lang).replace(dirPlaceholder, textDirection)
			},
		})
	}
}

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace App {
		interface Locals {
			paraglide: {
				lang: string
				textDirection: "ltr" | "rtl"
			}
		}
	}
}
