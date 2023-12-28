import { LinkProps } from "next/link"

export function prefixStrategy(
	availableLanguageTags: readonly string[],
	sourceLanguageTag: string
) {
	function getLocaleFromPath(path: string): string | undefined {
		const maybeLocale = path.split("/")[1]
		if (!availableLanguageTags.includes(maybeLocale)) return undefined
		return maybeLocale
	}

	function getPathWithoutLocale(path: string): string {
		const locale = getLocaleFromPath(path)
		if (!locale) return path

		const pathWithoutLocale = path.replace(`/${locale}`, "")
		if (pathWithoutLocale === "") return "/"
		return pathWithoutLocale
	}

	function translatePath(path: string, newLocale: string): string {
		const pathWithoutLocale = getPathWithoutLocale(path)
		if (newLocale === sourceLanguageTag) return pathWithoutLocale
		const newPath = `/${newLocale}${pathWithoutLocale}`
		return newPath
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

		const pathname: string = typeof href === "object" ? href.pathname ?? "" : href

		//dont' touch relative links
		const isRelative = !pathname.startsWith("/")
		const translatedPathaname = isRelative ? pathname : translatePath(pathname, lang)

		// @ts-ignore
		return typeof href === "object"
			? { ...href, pathname: translatedPathaname }
			: translatedPathaname
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

	return {
		getLocaleFromPath,
		translatePath,
		translateHref,
	}
}
