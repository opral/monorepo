import { PathTranslations } from "../pathnames/types"
import { resolvePath } from "../pathnames/matching/resolvePath"
import { matches } from "../pathnames/matching/match"
import { RoutingStragey } from "./interface"
import { NextRequest } from "next/server"

/*
	Canonical Path = Path without locale (how you write the href)
	Localised Path = Path with locale (how the path is visible in the URL bar)
*/

export function prefixStrategy<T extends string>({
	availableLanguageTags,
	defaultLanguage,
	pathnames,
	exclude,
}: {
	availableLanguageTags: readonly T[]
	defaultLanguage: T
	pathnames: PathTranslations<T>
	exclude: (path: string) => boolean
}): RoutingStragey<T> {
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

	function resolveLanguage(request: NextRequest): T {
		const localisedPathname = decodeURI(request.nextUrl.pathname)
		return getLocaleFromLocalisedPath(localisedPathname) ?? defaultLanguage
	}

	function getCanonicalPath(localisedPath: string): string {
		const locale = getLocaleFromLocalisedPath(localisedPath) ?? defaultLanguage
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

		let localisedPath = locale === defaultLanguage ? translatedPath : `/${locale}${translatedPath}`

		if (localisedPath.endsWith("/")) localisedPath = localisedPath.slice(0, -1)
		localisedPath ||= "/"
		return localisedPath
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

	function translatePath(localisedPath: string, newLocale: T): string {
		const canonicalPath = getCanonicalPath(localisedPath)
		return getLocalisedPath(canonicalPath, newLocale)
	}

	return {
		getLocalisedPath,
		getCanonicalPath,
		translatePath,
		resolveLanguage,
		defaultLanguage,
	}
}
