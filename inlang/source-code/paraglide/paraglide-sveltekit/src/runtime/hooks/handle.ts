import type { Handle } from "@sveltejs/kit"
import type { I18nConfig } from "../adapter.js"
import { parseRoute } from "../utils/route.js"
import { negotiateLanguagePreferences } from "@inlang/paraglide-js/internal/adapter-utils"
import { base } from "$app/paths"
import { dev } from "$app/environment"
import type { RoutingStrategy } from "../strategy.js"
import type { ParaglideLocals } from "../locals.js"

const LANG_COOKIE_NAME = "paraglide:lang"

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
	strategy: RoutingStrategy<T>,
	i18n: I18nConfig<T>,
	options: HandleOptions
): Handle => {
	const langPlaceholder = options.langPlaceholder ?? "%paraglide.lang%"
	const dirPlaceholder = options.textDirectionPlaceholder ?? "%paraglide.textDirection%"

	return ({ resolve, event }) => {
		const [localisedPath] = parseRoute(event.url.pathname as `/${string}`, base)
		const langFromUrl = strategy.getLanguageFromLocalisedPath(localisedPath)

		const langCookie = event.cookies.get(LANG_COOKIE_NAME)
		const cookieLang = i18n.runtime.isAvailableLanguageTag(langCookie) ? langCookie : undefined

		const negotiatedLanguagePreferences = negotiateLanguagePreferences(
			event.request.headers.get("accept-language"),
			i18n.runtime.availableLanguageTags
		)
		const negotiatedLanguage = negotiatedLanguagePreferences[0]

		const lang = langFromUrl ?? cookieLang ?? negotiatedLanguage ?? i18n.defaultLanguageTag

		if (lang !== langFromUrl) {
			// redirect to the correct language
			const localisedPathname = strategy.getLocalisedPath(localisedPath, lang)
			return new Response(undefined, {
				status: 302,
				headers: {
					Location: localisedPathname,
				},
			})
		}

		if (lang !== cookieLang) {
			event.cookies.set(LANG_COOKIE_NAME, lang, {
				maxAge: 31557600, //Math.round(60 * 60 * 24 * 365.25) = 1 year,
				sameSite: "lax",
				path: base || "/",
			})
		}

		const textDirection = i18n.textDirection[lang as T] ?? "ltr"

		const paraglideLocals: ParaglideLocals<T> = {
			lang,
			textDirection,
		}

		// @ts-expect-error
		// The user needs to have the ParaglideLocals type in their app.d.ts file
		event.locals.paraglide = paraglideLocals

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
						[
							"It seems like you haven't replaced the `lang` attribute in your `src/app.html` file.",
							"Please replace the `lang` attribute with the correct placeholder:",
							"",
							` - <html ${SVELTEKIT_DEFAULT_LANG_ATTRIBUTE}>`,
							` + <html lang="${langPlaceholder}" dir="${dirPlaceholder}">`,
							"",
							"This message will not be shown in production.",
						].join("\n")
					)
				}

				return html.replace(langPlaceholder, lang).replace(dirPlaceholder, textDirection)
			},
		})
	}
}

