import { createLink } from "./Link"
import { getLanguage } from "./getLanguage.client"
import { availableLanguageTags, sourceLanguageTag } from "$paraglide/runtime.js"
import { prefixStrategy } from "./routing/prefix"
import { createNavigation, createRedirects } from "./navigation"
import { ExcludeConfig, createExclude } from "./exclude"
import { createMiddleware } from "./middleware"

/**
 * Configuration for the Adapter.
 */
export type I18nOptions<T extends string> = {
	/**
	 * A list of patterns that should not be localized.
	 *
	 * @example
	 * ```ts
	 * exclude: [/^\/api\//] // Exclude `/api/*` from localization
	 * ```
	 *
	 * @default []
	 */
	exclude?: ExcludeConfig

	/**
	 * The default language to use when no language is set.
	 *
	 * @default sourceLanguageTag
	 */
	defaultLanguage?: T

	/**
	 * A map of text-directions for each language.
	 */
	textDirection?: Record<T, "ltr" | "rtl">
}

export function createI18n<T extends string = string>(options: I18nOptions<T> = {}) {
	const exclude = createExclude(options.exclude ?? [])

	const strategy = prefixStrategy<T>({
		availableLanguageTags,
		defaultLanguage: sourceLanguageTag,
		exclude,
	})

	/**
	 * React Component that enables cslient-side transitions between routes.
	 *
	 * Automatically localises the href based on the current language.
	 */
	const Link = createLink<T>(getLanguage, strategy)
	const { usePathname, useRouter } = createNavigation<T>(getLanguage, strategy)
	const { redirect, permanentRedirect } = createRedirects<T>(getLanguage, strategy)
	const middleware = createMiddleware<T>(strategy)

	return {
		Link,
		usePathname,
		middleware,
		useRouter,
		redirect,
		permanentRedirect,
	}
}
