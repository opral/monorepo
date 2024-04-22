import { getLanguage } from "./getLanguage.server"
import { availableLanguageTags, setLanguageTag, sourceLanguageTag } from "$paraglide/runtime.js"
import { createNavigation } from "./navigation"
import { createExclude } from "./exclude"
import { createMiddleware } from "./middleware"
import { resolveUserPathDefinitions } from "@inlang/paraglide-js/internal/adapter-utils"
import { I18nUserConfig, ResolvedI18nConfig } from "./config"
import { PrefixStrategy } from "./routing/prefixStrategy"

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
 * import { createI18n } from "@inlang/paraglide-sveltekit"
 *
 * export const i18n = createI18n({ ...options })
 * ```
 *
 * @deprecated
 * Use `createMiddleware` and `createNavigation` instead
 */
export function createI18n<T extends string = string>(userConfig: I18nUserConfig<T> = {}) {
	setLanguageTag(getLanguage)

	const config: ResolvedI18nConfig<T> = {
		availableLanguageTags: availableLanguageTags as readonly T[],
		exclude: createExclude(userConfig.exclude ?? []),
		pathnames: resolveUserPathDefinitions(userConfig.pathnames ?? {}, availableLanguageTags as T[]),
		prefix: userConfig.prefix ?? "except-default",
	}

	const strategy = PrefixStrategy({
		availableLanguageTags: config.availableLanguageTags,
		exclude: config.exclude,
		defaultLanguage: sourceLanguageTag as T,
		pathnames: userConfig.pathnames || {},
		prefix: config.prefix,
	})

	const navigation = createNavigation({
		strategy,
	})
	const middleware = createMiddleware<T>({ strategy })

	return {
		middleware,
		/** @deprecated - Use getLocalisedHref instead */
		localizePath: (canonicalPath: string, lang: T) => {
			return strategy.getLocalisedUrl(canonicalPath, lang, getLanguage() !== lang).pathname
		},
		getLocalisedUrl: strategy.getLocalisedUrl,
		...navigation,
	}
}
