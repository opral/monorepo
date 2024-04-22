import { createLink } from "./Link"
import { getLanguage } from "./getLanguage.client"
import { availableLanguageTags, sourceLanguageTag } from "$paraglide/runtime.js"
import { createNavigation, createRedirects } from "./navigation"
import { createExclude } from "./exclude"
import { createMiddleware } from "./middleware"
import { I18nUserConfig, ResolvedI18nConfig } from "./config"
import {
	prettyPrintPathDefinitionIssues,
	resolveUserPathDefinitions,
	validatePathTranslations,
} from "@inlang/paraglide-js/internal/adapter-utils"
import { PrefixStrategy } from "./routing/prefixStrategy"

export function createI18n<T extends string = string>(userConfig: I18nUserConfig<T> = {}) {
	const config: ResolvedI18nConfig<T> = {
		availableLanguageTags: availableLanguageTags as readonly T[],
		defaultLanguage: userConfig.defaultLanguage ?? (sourceLanguageTag as T),
		exclude: createExclude(userConfig.exclude ?? []),
		pathnames: resolveUserPathDefinitions(userConfig.pathnames ?? {}, availableLanguageTags as T[]),
		prefix: userConfig.prefix ?? "except-default",
	}

	if (process.env.NODE_ENV === "development") {
		const issues = validatePathTranslations(config.pathnames, availableLanguageTags as T[], {})
		if (issues.length) {
			console.warn(
				"Issues were found with your pathnames. Fix them before deploying:\n\n" +
					prettyPrintPathDefinitionIssues(issues)
			)
		}
	}

	const strategy = PrefixStrategy(config)

	/**
	 * React Component that enables cslient-side transitions between routes.
	 *
	 * Automatically localises the href based on the current language.
	 */
	const Link = createLink<T>(getLanguage, config, strategy)
	const { usePathname, useRouter } = createNavigation<T>(getLanguage, strategy)
	const { redirect, permanentRedirect } = createRedirects<T>(getLanguage, strategy)
	const middleware = createMiddleware<T>(config, strategy)

	return {
		Link,
		usePathname,
		localizePath: strategy.getLocalisedPath,
		middleware,
		useRouter,
		redirect,
		permanentRedirect,
	}
}
