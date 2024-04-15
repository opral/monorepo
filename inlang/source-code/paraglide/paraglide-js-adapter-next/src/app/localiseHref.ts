import type { RoutingStragey } from "./routing/interface"
import type { LinkProps } from "next/link"

const getPathname = (href: string, currentHref: string): string =>
	new URL(href, currentHref).pathname

export function createLocaliseHref<T extends string>(
	strategy: RoutingStragey<T>
): <P extends LinkProps["href"]>(
	canonicalHref: P,
	lang: T,
	currentHref: string,
	isLanugageSwitch: boolean
) => P {
	return <P extends LinkProps["href"]>(
		canonicalHref: P,
		lang: T,
		currentHref: string,
		isLanugageSwitch: boolean
	): P => {
		//don't translate external links
		if (isExternal(canonicalHref)) return canonicalHref

		// don't touch relative links
		if (typeof canonicalHref === "string" && !canonicalHref.startsWith("/")) return canonicalHref

		//guard against empty pathnames on object hrefs
		if (typeof canonicalHref === "object" && !canonicalHref.pathname) return canonicalHref

		const canonicalPathname: string =
			typeof canonicalHref === "object"
				? canonicalHref.pathname ?? ""
				: getPathname(canonicalHref, currentHref)

		//dont' touch relative links
		if (!canonicalPathname.startsWith("/")) return canonicalHref

		const translatedUrl = strategy.getLocalisedUrl(canonicalPathname, lang, isLanugageSwitch)

		return typeof canonicalHref === "object"
			? ({ ...canonicalHref, ...translatedUrl } as P)
			: (canonicalHref.replace(canonicalPathname, translatedUrl.pathname) as P)
	}
}

/**
 * Returns true if the href explicitly includes the origin, even if it's the current origin
 */
export function isExternal(href: LinkProps["href"]) {
	//Make sure none of the telltales for external links are set
	if (typeof href === "object") {
		return Boolean(href.protocol || href.auth || href.port || href.hostname || href.host)
	}

	//Make sure the href isn't a full url
	const [, ...rest] = href.split(":")
	if (rest.length === 0) return false

	const schemeRegex = /^[a-z][a-z0-9+\-.]*:/i
	return (
		// href must not start with a url scheme
		// see: https://datatracker.ietf.org/doc/html/rfc3986#section-3.1
		schemeRegex.test(href) ||
		//If the href starts with // it's a protocol relative url -> must include the host -> external
		href.startsWith("//")
	)
}
