import { getLanguage } from "./getLanguage.client"
import { availableLanguageTags, sourceLanguageTag } from "$paraglide/runtime.js"
import { createNavigation } from "./navigation"
import { createExclude } from "./exclude"
import { createMiddleware } from "./middleware"
import { I18nUserConfig, ResolvedI18nConfig } from "./config"
import { resolveUserPathDefinitions } from "@inlang/paraglide-js/internal/adapter-utils"
import { PrefixStrategy } from "./routing/prefixStrategy"

export function createI18n<T extends string = string>(userConfig: I18nUserConfig<T> = {}) {
	const config: ResolvedI18nConfig<T> = {
		availableLanguageTags: availableLanguageTags as readonly T[],
		defaultLanguage: userConfig.defaultLanguage ?? (sourceLanguageTag as T),
		exclude: createExclude(userConfig.exclude ?? []),
		pathnames: resolveUserPathDefinitions(userConfig.pathnames ?? {}, availableLanguageTags as T[]),
		prefix: userConfig.prefix ?? "except-default",
	}

	const strategy = PrefixStrategy({
		availableLanguageTags: config.availableLanguageTags,
		exclude: config.exclude,
		defaultLanguage: config.defaultLanguage,
		userPathnames: userConfig.pathnames || {},
		prefix: config.prefix,
	})

	const navigation = createNavigation({
		languageTag: getLanguage,
		strategy,
		config,
	})
	const middleware = createMiddleware<T>({ config, strategy })

	return {
		localizePath: (canonicalPath: string, lang: T) => {
			return strategy.getLocalisedUrl(canonicalPath, lang, getLanguage() !== lang).pathname
		},
		getLocalisedUrl: strategy.getLocalisedUrl,
		middleware,
		...navigation,
	}
}
