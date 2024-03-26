import { PathTranslations } from "../pathnames/types"
import { resolvePath } from "../pathnames/matching/resolvePath"
import { matches } from "../pathnames/matching/match"
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
	/**
	 * Get's the language tag from the localised path.
	 * If no language tag is _explicitly_ in the path, returns undefined
	 *
	 * @example
	 * ```ts
	 * getLocaleFromLocalisedPath("/de/ueber-uns") // "de"
	 * getLocaleFromLocalisedPath("/en/about") // "en"
	 * getLocaleFromLocalisedPath("/about") // undefined
	 * ```
	 */
	function getLocaleFromLocalisedPath(localisedPath: string): T | undefined {
		const [, maybeLocale] = localisedPath.split("/")
		if (!availableLanguageTags.includes(maybeLocale as T)) return undefined
		return maybeLocale as T
	}

	function resolveLanguage(request: NextRequest): T | undefined {
		const localisedPathname = decodeURI(request.nextUrl.pathname)
		const localeInPath = getLocaleFromLocalisedPath(localisedPathname)

		switch (prefix) {
			case "all": {
				return localeInPath
			}
			case "except-default": {
				return localeInPath ?? defaultLanguage
			}
			case "never": {
				return undefined
			}
		}
	}

	function getCanonicalPath(localisedPath: string, locale: T): string {
		let pathWithoutLocale = localisedPath.startsWith(`/${locale}`)
			? localisedPath.replace(`/${locale}`, "")
			: localisedPath

		pathWithoutLocale ||= "/"

		for (const [canonicalPathDefinition, translationsForPath] of Object.entries(pathnames)) {
			if (!(locale in translationsForPath)) continue

			const translatedPathDefinition = translationsForPath[locale]
			if (!translatedPathDefinition) continue

			const match = matches(pathWithoutLocale, [translatedPathDefinition])
			if (!match) continue

			return resolvePath(canonicalPathDefinition, match.params)
		}

		return pathWithoutLocale
	}

	function getLocalisedPath(canonicalPath: string, locale: T): string {
		if (exclude(canonicalPath)) return canonicalPath

		const translatedPath = getTranslatedPath(canonicalPath, locale, pathnames)

		const shouldAddPrefix =
			prefix === "never" ? false : prefix === "except-default" ? locale !== defaultLanguage : true

		let localisedPath = shouldAddPrefix ? `/${locale}${translatedPath}` : translatedPath

		//remove trailing slash
		if (localisedPath.endsWith("/")) localisedPath = localisedPath.slice(0, -1)

		//add "/" if path is empty
		return localisedPath || "/"
	}

	function getTranslatedPath(canonicalPath: string, lang: T, translations: PathTranslations<T>) {
		const match = matches(canonicalPath, Object.keys(translations))
		if (!match) return canonicalPath

		const translationsForPath = translations[match.id as `/${string}`]
		if (!translationsForPath) return canonicalPath

		const translatedPath = translationsForPath[lang]
		if (!translatedPath) return canonicalPath

		return resolvePath(translatedPath, match.params)
	}

	function translatePath(localisedPath: string, currentLocale: T, newLocale: T): string {
		const canonicalPath = getCanonicalPath(localisedPath, currentLocale)
		return getLocalisedPath(canonicalPath, newLocale)
	}

	return {
		getLocalisedPath,
		getCanonicalPath,
		translatePath,
		resolveLanguage,
	}
}
