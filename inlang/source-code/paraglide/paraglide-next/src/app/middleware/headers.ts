import type { UrlObject } from "node:url"
import type { NextRequest } from "next/server"
import type { RoutingStrategy } from "../routing-strategy/interface"
import { addPathPrefix } from "../utils/basePath"
import { format } from "../utils/format"

/**
 * Adds SEO headers
 */
export function addSeoHeaders<T extends string>(
	headers: Headers,
	{
		canonicalPath,
		availableLanguageTags,
		request,
		strategy,
	}: {
		canonicalPath: `/${string}`
		availableLanguageTags: readonly T[]
		request: NextRequest
		strategy: RoutingStrategy<T>
	}
) {
	if (!isPageRequest(request)) return
	if (availableLanguageTags.length <= 1) return

	const nextUrl = request.nextUrl
	const alternateLinks = Object.fromEntries(
		availableLanguageTags.map((lang) => {
			const localizedUrl = strategy.getLocalisedUrl(canonicalPath, lang, true)

			const destination: UrlObject = {
				...localizedUrl,
				...nextUrl,
			}

			destination.pathname = addPathPrefix(encodeURI(destination.pathname || "/"), nextUrl.basePath)
			return [lang, format(destination)]
		})
	) as Record<T, string>

	// make sure the links are unique
	const linksAreUnique =
		new Set(Object.values(alternateLinks)).size === Object.keys(alternateLinks).length

	if (linksAreUnique) {
		const linkHeader = Object.entries(alternateLinks)
			.map(([lang, href]) => `<${href}>; rel="alternate"; hreflang="${lang}"`)
			.join(", ")
		headers.set("Link", linkHeader)
	} else {
		// Vary based on cookies and accept header
		headers.set("Vary", "Cookie, Accept-Language")
	}
}

/**
 * Checks if the given request is for a page
 */
function isPageRequest(request: NextRequest) {
	const acceptHeader = request.headers.get("accept")
	return acceptHeader?.includes("text/html")
}
