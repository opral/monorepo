import type { RoutingStragey } from "./routing/interface"
import type { LinkProps } from "next/link"

export function createLocaliseHref<T extends string>(
	strategy: RoutingStragey<T>
): <P extends LinkProps["href"]>(canonicalHref: P, lang: T) => P {
	return <P extends LinkProps["href"]>(canonicalHref: P, lang: T): P => {
		//don't translate external links
		if (isExternal(canonicalHref)) return canonicalHref

		//guard against empty pathnames on object hrefs
		if (typeof canonicalHref === "object" && !canonicalHref.pathname) return canonicalHref

		const canonicalPathname: string =
			typeof canonicalHref === "object" ? canonicalHref.pathname ?? "" : getPathname(canonicalHref)

		if (!isAbsolute(canonicalPathname)) return canonicalHref

		//dont' touch relative links
		const translatedPathaname = strategy.getLocalisedPath(canonicalPathname, lang)

		// @ts-ignore
		return typeof canonicalHref === "object"
			? { ...canonicalHref, pathname: translatedPathaname }
			: canonicalHref.replace(canonicalPathname, translatedPathaname)
	}
}

const getPathname = (href: string): string => new URL(href, "http://example.com").pathname

const isAbsolute = (path: string): path is `/${string}` => path.startsWith("/")

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
