import type { NextRequest } from "next/server"
import { RoutingStrategy } from "../routing-strategy/interface"
import { addPathPrefix } from "../utils/basePath"
import { format } from "../utils/format"
import { LINK_HEADER_NAME } from "../constants"

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
	if (!shouldAddSeoHeaders(request, availableLanguageTags)) return

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

	const linkHeader = alternates.join(", ")
	headers.set(LINK_HEADER_NAME, linkHeader)
}

function shouldAddSeoHeaders(request: NextRequest, availableLanguageTags: readonly string[]) {
	if (availableLanguageTags.length <= 1) return false
	const acceptHeader = request.headers.get("accept")
	return acceptHeader?.includes("text/html")
}
