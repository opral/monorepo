import type { LinkProps } from "next/link"

/*
	Canonical Path = Path without locale (how you write the href)
	Localised Path = Path with locale (how the path is visible in the URL bar)
*/

export function prefixStrategy(
	availableLanguageTags: readonly string[],
	sourceLanguageTag: string
) {
	function getLocaleFromLocalisedPath(localisedPath: string): string | undefined {
		const maybeLocale = localisedPath.split("/")[1]
		if (!availableLanguageTags.includes(maybeLocale)) return undefined
		return maybeLocale
	}

	function getCanonicalPath(localisedPath: string): string {
		const locale = getLocaleFromLocalisedPath(localisedPath)
		if (!locale) return localisedPath

		const pathWithoutLocale = localisedPath.replace(`/${locale}`, "")
		if (pathWithoutLocale === "") return "/"
		return pathWithoutLocale
	}

	function getLocalisedPath(canonicalPath: string, locale: string): string {
		if (locale === sourceLanguageTag) return canonicalPath
		return `/${locale}${canonicalPath}`
	}

	function translatePath(localisedPath: string, newLocale: string): string {
		const canonicalPath = getCanonicalPath(localisedPath)
		return getLocalisedPath(canonicalPath, newLocale)
	}

	/**
	 * Takes an argument that could be passed to next/link's href prop
	 * and translates it to the given language.
	 *
	 * The type of the returned value is the same as the type of the argument. (Eg string stays string, object stays object)
	 */
	function translateHref<T extends LinkProps["href"]>(href: T, lang: string): T {
		//don't translate external links
		if (isExternal(href)) return href
		if (typeof href === "object" && !href.pathname) return href

		const canonicalPathname: string = typeof href === "object" ? href.pathname ?? "" : href

		//dont' touch relative links
		const isRelative = !canonicalPathname.startsWith("/")
		const translatedPathaname = isRelative
			? canonicalPathname
			: getLocalisedPath(canonicalPathname, lang)

		// @ts-ignore
		return typeof href === "object"
			? { ...href, pathname: translatedPathaname }
			: translatedPathaname
	}

	return {
		getLocaleFromLocalisedPath,
		getLocalisedPath,
		getCanonicalPath,
		translatePath,
		translateHref,
	}
}

/**
 * Returns true if the href explicitly includes the origin, even if it's the current origin
 */
function isExternal(href: LinkProps["href"]) {
	if (typeof href === "object") {
		//Make sure none of the telltales for external links are set
		const externalTelltales = [href.protocol, href.auth, href.port, href.hostname, href.host]
		for (const telltale of externalTelltales) {
			if (telltale) return true
		}
		return false
	}

	//Make sure the href isn't a full url
	const [maybeProtocol, ...rest] = href.split(":")
	if (rest.length === 0) return false

	// href must not start with a url scheme
	// see: https://datatracker.ietf.org/doc/html/rfc3986#section-3.1
	const schemeRegex = /^[a-z][a-z0-9+\-.]*:/i
	if (schemeRegex.test(maybeProtocol)) return true

	//If the href starts with // it's a protocol relative url -> must include the host -> external
	if (href.startsWith("//")) return true
	return false
}
