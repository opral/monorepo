import { parseRoute } from "../utils/route.js"
import { negotiateLanguagePreferences } from "@inlang/paraglide-js/internal/adapter-utils"
import { base } from "$app/paths"
import { dev } from "$app/environment"
import { LANG_COOKIE_NAME } from "../../constants.js"
import type { Handle } from "@sveltejs/kit"
import type { I18nConfig } from "../adapter.server.js"
import type { RoutingStrategy } from "../strategy.js"
import type { ParaglideLocals } from "../locals.js"
import { AsyncLocalStorage } from "node:async_hooks"

/**
 * The default lang attribute string that's in SvelteKit's `src/app.html` file.
 * If this is present on the `<html>` attribute it most likely needs to be replaced.
 */
const SVELTEKIT_DEFAULT_LANG_ATTRIBUTE = 'lang="en"'

const localeAsyncLocalStorage = new AsyncLocalStorage<string>()

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
	i18n.runtime.setLanguageTag(() => {
		const val = localeAsyncLocalStorage.getStore()
		return i18n.runtime.isAvailableLanguageTag(val) ? val : i18n.defaultLanguageTag
	})

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

		if (lang !== langFromUrl && !i18n.exclude(localisedPath)) {
			// redirect to the correct language
			const localisedPathname = strategy.getLocalisedPath(localisedPath, lang)
			return new Response(undefined, {
				status: 302,
				headers: {
					Location: localisedPathname,
				},
			})
		}

		if (lang !== cookieLang && !i18n.exclude(event.url.pathname)) {
			event.cookies.set(LANG_COOKIE_NAME, lang, {
				maxAge: 31557600, //Math.round(60 * 60 * 24 * 365.25) = 1 year,
				sameSite: "lax",
				path: base || "/",
				httpOnly: false,
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

		return localeAsyncLocalStorage.run(paraglideLocals.lang, async () => {
			return await resolve(event, {
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
		})
	}
}
