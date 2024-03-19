import { createLink } from "./Link"
import { getLanguage } from "./getLanguage.server"
import { availableLanguageTags, sourceLanguageTag } from "$paraglide/runtime.js"
import { createNoopNavigation, createRedirects } from "./navigation"
import { createExclude } from "./exclude"
import { createMiddleware } from "./middleware"
import { resolvePathTranslations } from "./pathnames/resolvePathTranslations"
import { validatePathTranslations } from "./pathnames/validatePathTranslations"
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
 * import { createI18n } from "@inlang/paraglide-js-adapter-sveltekit"
 *
 * export const i18n = createI18n({ ...options })
 * ```
 */
export function createI18n<T extends string = string>(userConfig: I18nUserConfig<T> = {}) {
	const config: ResolvedI18nConfig<T> = {
		availableLanguageTags: availableLanguageTags as readonly T[],
		defaultLanguage: userConfig.defaultLanguage ?? (sourceLanguageTag as T),
		exclude: createExclude(userConfig.exclude ?? []),
		pathnames: resolvePathTranslations(userConfig.pathnames ?? {}, availableLanguageTags as T[]),
		prefix: userConfig.prefix ?? "except-default",
	}

	if (process.env.NODE_ENV === "development") {
		const issues = validatePathTranslations(config.pathnames, availableLanguageTags as T[])
		if (issues.length) {
			console.warn(
				`The following issues were found in your path translations. Make sure to fix them before deploying your app:`
			)
			console.info(JSON.stringify(issues, undefined, 2))
		}
	}

	const strategy = PrefixStrategy(config)

	/**
	 * React Component that enables client-side transitions between routes.
	 *
	 * Automatically localises the href based on the current language.
	 */
	const Link = createLink<T>(getLanguage, config, strategy)
	const { usePathname, useRouter } = createNoopNavigation<T>()
	const { redirect, permanentRedirect } = createRedirects<T>(getLanguage, strategy)
	const middleware = createMiddleware<T>(config, strategy)

	return {
		Link,
		usePathname,
		middleware,
		localizePath: strategy.getLocalisedPath,
		useRouter,
		redirect,
		permanentRedirect,
	}
}
