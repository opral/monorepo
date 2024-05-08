import type { RoutingStrategy } from "./routing-strategy/interface"
import type { LinkProps } from "next/link"
import { isExternal as isStringHrefExternal } from "./utils/href"

const getPathname = (href: string, currentPath: string): `/${string}` => {
	const base = new URL(currentPath, "http://n")
	const resolved = new URL(href, base)
	return resolved.pathname as `/${string}`
}

export function createLocaliseHref<T extends string>(
	strategy: RoutingStrategy<T>
): <P extends LinkProps["href"]>(
	canonicalHref: P,
	lang: T,
	currentPath: string,
	isLanugageSwitch: boolean
) => P {
	return <P extends LinkProps["href"]>(
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
}

/**
 * Returns true if the href explicitly includes the origin, even if it's the current origin
 */
export function isExternal(href: LinkProps["href"]) {
	return typeof href === "object"
		? //Make sure none of the telltales for external links are set
		  Boolean(href.protocol || href.auth || href.port || href.hostname || href.host)
		: isStringHrefExternal(href)
}
