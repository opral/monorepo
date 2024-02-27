import type { LinkProps } from "next/link"
import { PathTranslations } from "../pathnames/types"
import { resolvePath } from "../pathnames/matching/resolvePath"
import { matches } from "../pathnames/matching/match"

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

	/**
	 * The language that should not be prefixed with a language tag
	 * Usually is the source language, but doesn't have to be
	 */
	defaultLanguage: T
	pathnames: PathTranslations<T>
	exclude: (path: string) => boolean
}) {
	function getLocaleFromLocalisedPath(localisedPath: string): T | undefined {
		const maybeLocale = localisedPath.split("/")[1]
		if (!availableLanguageTags.includes(maybeLocale as T)) return undefined
		return maybeLocale as T
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

	/**
	 * Takes an argument that could be passed to next/link's href prop
	 * and localises it in the given language.
	 *
	 * The type of the returned value is the same as the type of the argument. (Eg string stays string, object stays object)
	 */
	function localiseHref<P extends LinkProps["href"]>(canonicalHref: P, lang: T): P {
		//don't translate external links
		if (isExternal(canonicalHref)) return canonicalHref

		//guard against empty pathnames on object hrefs
		if (typeof canonicalHref === "object" && !canonicalHref.pathname) return canonicalHref

		const canonicalPathname: string =
			typeof canonicalHref === "object" ? canonicalHref.pathname ?? "" : getPathname(canonicalHref)

		if (!isAbsolute(canonicalPathname)) return canonicalHref

		//dont' touch relative links
		const translatedPathaname = getLocalisedPath(canonicalPathname, lang)

		// @ts-ignore
		return typeof canonicalHref === "object"
			? { ...canonicalHref, pathname: translatedPathaname }
			: canonicalHref.replace(canonicalPathname, translatedPathaname)
	}

	return {
		getLocaleFromLocalisedPath,
		getLocalisedPath,
		getCanonicalPath,
		translatePath,
		localiseHref,
		defaultLanguage,
	}
}

function getPathname(href: string): string {
	const url = new URL(href, "http://example.com")
	return url.pathname
}

function isAbsolute(path: string): path is `/${string}` {
	return path.startsWith("/")
}

/**
 * Returns true if the href explicitly includes the origin, even if it's the current origin
 */
export function isExternal(href: LinkProps["href"]) {
	if (typeof href === "object") {
		//Make sure none of the telltales for external links are set
		const externalTelltales = [href.protocol, href.auth, href.port, href.hostname, href.host]
		for (const telltale of externalTelltales) {
			if (telltale) return true
		}
		return false
	}

	//Make sure the href isn't a full url
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [maybeProtocol, ...rest] = href.split(":")
	if (rest.length === 0) return false

	// href must not start with a url scheme
	// see: https://datatracker.ietf.org/doc/html/rfc3986#section-3.1
	const schemeRegex = /^[a-z][a-z0-9+\-.]*:/i
	if (schemeRegex.test(href)) return true

	//If the href starts with // it's a protocol relative url -> must include the host -> external
	if (href.startsWith("//")) return true

	return false
}

export type RoutingStrategy<T extends string> = ReturnType<typeof prefixStrategy<T>>
