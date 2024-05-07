import { getLanguage } from "../getLanguage.server"
import { availableLanguageTags, setLanguageTag } from "$paraglide/runtime.js"
import { Navigation } from "../navigation/navigation.server"
import { createExclude } from "../exclude"
import { Middleware } from "../middleware"
import { resolveUserPathDefinitions } from "@inlang/paraglide-js/internal/adapter-utils"
import { I18nUserConfig, ResolvedI18nConfig } from "./config"
import { PrefixStrategy } from "../routing-strategy/strats/prefixStrategy"

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
		exclude: createExclude(userConfig.exclude ?? []),
		pathnames: resolveUserPathDefinitions(userConfig.pathnames ?? {}, availableLanguageTags as T[]),
		prefix: userConfig.prefix ?? "except-default",
	}

	const strategy = PrefixStrategy<T>({
		exclude: config.exclude,
		pathnames: userConfig.pathnames || {},
		prefixDefault: config.prefix === "except-default" ? "never" : "always",
	})

	const navigation = Navigation<T>({ strategy })
	const middleware = Middleware<T>({ strategy })

	return {
		/** @deprecated - Use getLocalisedHref instead */
		localizePath: (canonicalPath: `/${string}`, lang: T) => {
			return strategy.getLocalisedUrl(canonicalPath, lang, getLanguage() !== lang).pathname
		},
		getLocalisedUrl: strategy.getLocalisedUrl,
		middleware,
		...navigation,
	}
}
