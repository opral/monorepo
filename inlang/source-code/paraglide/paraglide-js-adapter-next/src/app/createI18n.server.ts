import { createLink } from "./Link"
import { getLanguage } from "./getLanguage.server"
import { availableLanguageTags, sourceLanguageTag } from "$paraglide/runtime.js"
import { prefixStrategy } from "./routing/prefix"
import { createNoopNavigation, createRedirects } from "./navigation"
import { createExclude } from "./exclude"
import { createMiddleware } from "./middleware"
import { I18nOptions } from "./config"
import { resolvePathTranslations } from "./pathnames/resolvePathTranslations"
import { validatePathTranslations } from "./pathnames/validatePathTranslations"

/**
 * Creates an i18n instance that manages your internationalization.
 *
 * @param options The options for the i18n instance.
 * @returns An i18n instance.
 *
 * @example
 * ```ts
 * // src/lib/i18n.js:
 * import * as runtime from "../paraglide/runtime.js"
 * import { createI18n } from "@inlang/paraglide-js-adapter-sveltekit"
 *
 * export const i18n = createI18n({ ...options })
 * ```
 */
export function createI18n<T extends string = string>(options: I18nOptions<T> = {}) {
	const exclude = createExclude(options.exclude ?? [])
	const pathnames = resolvePathTranslations(options.pathnames ?? {}, availableLanguageTags as T[])

	if (process.env.NODE_ENV === "development") {
		const issues = validatePathTranslations(pathnames, availableLanguageTags as T[])
		if (issues.length) {
			console.warn(
				`The following issues were found in your path translations. Make sure to fix them before deploying your app:`
			)
			console.info(JSON.stringify(issues, undefined, 2))
		}
	}

	const strategy = prefixStrategy<T>({
		availableLanguageTags: availableLanguageTags as readonly T[],
		pathnames,
		defaultLanguage: options.defaultLanguage ?? (sourceLanguageTag as T),
		exclude,
	})

	/**
	 * React Component that enables client-side transitions between routes.
	 *
	 * Automatically localises the href based on the current language.
	 */
	const Link = createLink<T>(getLanguage, strategy)
	const { usePathname, useRouter } = createNoopNavigation<T>()
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