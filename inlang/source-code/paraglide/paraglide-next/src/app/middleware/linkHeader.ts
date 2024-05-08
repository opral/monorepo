import type { NextRequest } from "next/server"
import { RoutingStrategy } from "../routing-strategy/interface"
import { addPathPrefix } from "../utils/basePath"
import { format } from "../utils/format"

export function shouldAddLinkHeader(request: NextRequest) {
	const acceptHeader = request.headers.get("accept")
	return acceptHeader?.includes("text/html")
}

/**
 * Generates the Link header for the available language versions of the current page.
 */
export function generateLinkHeader<T extends string>(
	strategy: RoutingStrategy<T>,
	{
		canonicalPath,
		availableLanguageTags,
		request,
	}: {
		canonicalPath: `/${string}`
		availableLanguageTags: readonly T[]
		request: NextRequest
	}
): string {
	const alternates: string[] = []
	const nextUrl = request.nextUrl

	for (const lang of availableLanguageTags) {
		const localizedUrl = strategy.getLocalisedUrl(canonicalPath, lang, true)
		localizedUrl.pathname = encodeURI(localizedUrl.pathname || "/") as `/${string}`
		localizedUrl.pathname = addPathPrefix(localizedUrl.pathname, nextUrl.basePath) as `/${string}`

		localizedUrl.protocol ??= nextUrl.protocol
		localizedUrl.host ??= nextUrl.host
		localizedUrl.hostname ??= nextUrl.hostname
		localizedUrl.port ??= nextUrl.port
		localizedUrl.hash ??= nextUrl.hash
		localizedUrl.search ??= nextUrl.search

		const fullHref = format(localizedUrl)
		alternates.push(`<${fullHref}>; rel="alternate"; hreflang="${lang}"`)
	}

	return alternates.join(", ")
}
