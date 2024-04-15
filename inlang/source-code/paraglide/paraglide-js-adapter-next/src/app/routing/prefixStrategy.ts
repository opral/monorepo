import {
	PathDefinitionTranslations,
	resolveRoute,
	bestMatch,
} from "@inlang/paraglide-js/internal/adapter-utils"
import type { RoutingStragey } from "./interface"
import type { NextRequest } from "next/server"
import type { ResolvedI18nConfig } from "../config"

/*
	Canonical Path = Path without locale (how you write the href)
	Localised Path = Path with locale (how the path is visible in the URL bar)
*/

export function PrefixStrategy<T extends string>({
	availableLanguageTags,
	defaultLanguage,
	pathnames,
	exclude,
	prefix,
}: ResolvedI18nConfig<T>): RoutingStragey<T> {
	function getCanonicalPath(localisedPath: string, locale: T): string {
		let pathWithoutLocale = localisedPath.startsWith(`/${locale}`)
			? localisedPath.replace(`/${locale}`, "")
			: localisedPath

		pathWithoutLocale ||= "/"

		for (const [canonicalPathDefinition, translationsForPath] of Object.entries(pathnames)) {
			if (!(locale in translationsForPath)) continue

			const translatedPathDefinition = translationsForPath[locale]
			if (!translatedPathDefinition) continue

			const match = bestMatch(pathWithoutLocale, [translatedPathDefinition], {})
			if (!match) continue

			return resolveRoute(canonicalPathDefinition, match.params)
		}

		return pathWithoutLocale
	}

	function getTranslatedPath(
		canonicalPath: string,
		lang: T,
		translations: PathDefinitionTranslations<T>
	) {
		const match = bestMatch(canonicalPath, Object.keys(translations), {})
		if (!match) return canonicalPath

		const translationsForPath = translations[match.id as `/${string}`]
		if (!translationsForPath) return canonicalPath

		const translatedPath = translationsForPath[lang]
		if (!translatedPath) return canonicalPath

		return resolveRoute(translatedPath, match.params)
	}

	return {
		getLocalisedHref(canonicalPath, targetLanguage, currentLanguage, basePath) {
			if (exclude(canonicalPath)) return canonicalPath

			const translatedPath = getTranslatedPath(canonicalPath, targetLanguage, pathnames)
			const shouldAddPrefix =
				prefix === "never"
					? false
					: prefix === "except-default"
					? targetLanguage !== defaultLanguage
					: true

			const localisedPath = shouldAddPrefix ? `/${targetLanguage}${translatedPath}` : translatedPath
			return `${basePath}${localisedPath}`
		},
		getCanonicalPath,
	}
}
