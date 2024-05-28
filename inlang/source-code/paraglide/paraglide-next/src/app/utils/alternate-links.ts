import { availableLanguageTags, languageTag } from "$paraglide/runtime.js"
import { ResolvingMetadata } from "next"
import { RoutingStrategy } from "../index.client"
import { UrlObject, format, parse } from "node:url"

/**
 * Generates the metadata NextJS needs to generate the `<link rel="alternate"` headers.
 * Call this in your root-layout's `generateMetadata` function
 *
 * @example
 * ```ts
 * import { strategy } from "@/lib/i18n"
 * import { generateAlternateLinks } from "@inlang/paraglide-next"
 *
 * export function generateMetadata(props, parent) {
 *   return {
 *     alternates: {
 *       languages: generateAlternateLinks({
 *         base: "https://example.com",
 *         strategy: strategy,
 *         resolvingMetadata: parent
 *       }),
 *     }
 *   }
 * }
 * ```
 */
export function generateAlternateLinks<T extends string>({
	base,
	strategy,
	resolvingMetadata: parent,
}: {
	/**
	 * The base url, including the protocol, host and base-path
	 */
	base: `http${string}`
	/**
	 * The routing strategy
	 */
	strategy: RoutingStrategy<T>
	/**
	 * The ResolvingMetadata. Get this from the second argument of `generateMetadata`
	 */
	resolvingMetadata: ResolvingMetadata
}): Record<string, string> {
	type NextInternalRouteData = {
		urlPathname: string
	}

	const routeData = Object.getOwnPropertySymbols(parent)
		.map((symbol) => (parent as any)[symbol])
		.filter((thing) => typeof thing === "object")
		.filter((thing): thing is NextInternalRouteData => "urlPathname" in thing)
		.at(0)

	if (!routeData) return {}
	const locale = languageTag() as T

	//current pathname, rendered per page
	const localisedPathname = new URL(routeData.urlPathname, "https://n.com").pathname as `/${string}`
	const canonicalPathname = strategy.getCanonicalPath(localisedPathname, locale)

	return Object.fromEntries(
		(availableLanguageTags as readonly T[]).map((lang) => {
			const localisedUrl = strategy.getLocalisedUrl(canonicalPathname, lang, true)
			const baseUrl: UrlObject = parse(base)
			const url = { ...baseUrl, ...localisedUrl }
			const href = format(url)

			return [lang, href]
		})
	)
}
