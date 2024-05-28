import type { RoutingStrategy } from "./routing-strategy/interface"
import type { LinkProps } from "next/link"
import type { UrlObject } from "node:url"

const getPathname = (href: string, currentPath: string): `/${string}` => {
	return new URL(href, new URL(currentPath, "http://n")).pathname as `/${string}`
}

export const localizeHref = <T extends string, P extends LinkProps["href"]>(
	strategy: RoutingStrategy<T>,
	canonicalHref: P,
	lang: T,
	currentPath: string,
	isLanugageSwitch: boolean
): P => {
	//don't translate external links
	if (isExternal(canonicalHref)) return canonicalHref

	//guard against empty pathnames on object hrefs
	if (typeof canonicalHref === "object" && !canonicalHref.pathname) return canonicalHref

	const canonicalPathname =
		typeof canonicalHref === "object"
			? getPathname(canonicalHref.pathname ?? "", currentPath)
			: getPathname(canonicalHref, currentPath)

	const translatedUrl = strategy.getLocalisedUrl(canonicalPathname, lang, isLanugageSwitch)

	return typeof canonicalHref === "object"
		? ({ ...canonicalHref, ...translatedUrl } as P)
		: (canonicalHref.replace(canonicalPathname, translatedUrl.pathname) as P)
}

/**
 * Returns true if the href explicitly includes the origin, even if it's the current origin
 */
export const isExternal = (href: UrlObject | string) =>
	typeof href === "object"
		? //Make sure none of the telltales for external links are set
		  Boolean(href.protocol || href.auth || href.port || href.hostname || href.host)
		: isStringHrefExternal(href)

const isStringHrefExternal = (href: string): boolean =>
	// If the href starts with a url scheme
	// see: https://datatracker.ietf.org/doc/html/rfc3986#section-3.1
	/^[a-z][a-z0-9+\-.]*:/i.test(href) ||
	//If the href starts with // it's a protocol relative url -> must include the host -> external
	/^\/\//.test(href)
