import { parseRoute, serializeRoute } from "../utils/route.js"
import { negotiateLanguagePreferences } from "@inlang/paraglide-js/internal/adapter-utils"
import { base } from "$app/paths"
import { dev } from "$app/environment"
import { LANG_COOKIE_NAME } from "../../constants.js"
import type { Handle } from "@sveltejs/kit"
import type { I18nConfig } from "../adapter.server.js"
import type { RoutingStrategy } from "../strategy.js"
import type { ParaglideLocals } from "../locals.js"
import { ALSContext, GlobalContext, type Context } from "./utils.js"
import { getHrefBetween } from "../utils/diff-urls.js"

/**
 * The default lang attribute string that's in SvelteKit's `src/app.html` file.
 * If this is present on the `<html>` attribute it most likely needs to be replaced.
 */
const SVELTEKIT_DEFAULT_LANG_ATTRIBUTE = 'lang="en"'
const VARY_HEADER = ["cookie", "accept-language"].join(", ")

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

	/**
	 * If `AsyncLocalStorage` should be used to scope the language state to the current request.
	 * This makes it impossible for requests to override each other's language.
	 *
	 * ONLY DISABLE THIS IF YOU ARE CERTAIN YOUR ENVIRONMENT DOES
	 * NOT ALLOW CONCURRENT REQUESTS.
	 *
	 * For example in Vercel Edge functions
	 *
	 * @default false
	 */
	disableAsyncLocalStorage?: boolean
}

export const createHandle = <T extends string>(
	strategy: RoutingStrategy<T>,
	i18n: I18nConfig<T>,
	options: HandleOptions
): Handle => {
	let languageContext: Context<T> | undefined = undefined
	function initializeLanguageContext(
		AsyncLocalStorage: typeof import("node:async_hooks").AsyncLocalStorage | undefined
	) {
		languageContext = AsyncLocalStorage ? new ALSContext(AsyncLocalStorage) : new GlobalContext()
		i18n.runtime.setLanguageTag(() => {
			if (!languageContext)
				throw new Error(
					"languageContext not initialized - This should never happen, please file an issue"
				)
			const val = languageContext.get()
			return i18n.runtime.isAvailableLanguageTag(val) ? val : i18n.defaultLanguageTag
		})
	}

	const langPlaceholder = options.langPlaceholder ?? "%paraglide.lang%"
	const dirPlaceholder = options.textDirectionPlaceholder ?? "%paraglide.textDirection%"

	return async ({ resolve, event }) => {
		// if the langauge context is not yet initialized
		if (!languageContext) {
			const als = options.disableAsyncLocalStorage
				? undefined
				: (await import("node:async_hooks")).AsyncLocalStorage
			initializeLanguageContext(als)
		}

		const [localisedPath, suffix] = parseRoute(event.url.pathname as `/${string}`, base)
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
			const fullPath = serializeRoute(localisedPathname, base, suffix)

			const to = new URL(event.url)
			to.pathname = fullPath

			const href = getHrefBetween(event.url, to)

			return new Response(undefined, {
				status: 302,
				headers: {
					Location: href,
					Vary: VARY_HEADER,
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

		// The user needs to have the ParaglideLocals type in their app.d.ts file
		// @ts-expect-error
		event.locals.paraglide = paraglideLocals

		if (!languageContext)
			throw new Error(
				"languageContext not initialized - This should never happen, please file an issue"
			)
		return languageContext.callAsync(paraglideLocals.lang, async () => {
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
