import { createLink } from "./Link"
import { getLanguage } from "./getLanguage.client"
import { availableLanguageTags, sourceLanguageTag } from "$paraglide/runtime.js"
import { prefixStrategy } from "./routing/prefix"
import { createNavigation, createRedirects } from "./navigation"
import { createExclude } from "./exclude"
import { createMiddleware } from "./middleware"
import { I18nOptions } from "./config"
import { resolvePathTranslations } from "./pathnames/resolvePathTranslations"

export function createI18n<T extends string = string>(options: I18nOptions<T> = {}) {
	const exclude = createExclude(options.exclude ?? [])
	const pathnames = resolvePathTranslations(options.pathnames ?? {}, availableLanguageTags as T[])

	const strategy = prefixStrategy<T>({
		availableLanguageTags: availableLanguageTags as readonly T[],
		pathnames,
		defaultLanguage: options.defaultLanguage ?? (sourceLanguageTag as T),
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
	const middleware = createMiddleware<T>(exclude, strategy)

	return {
		Link,
		usePathname,
		middleware,
		useRouter,
		redirect,
		permanentRedirect,
	}
}
