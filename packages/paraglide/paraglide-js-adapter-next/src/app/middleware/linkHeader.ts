import type { NextRequest } from "next/server"
import { RoutingStragey } from "../routing/interface"
import { addPathPrefix } from "../utils/basePath"
import { format } from "node:url"

export function shouldAddLinkHeader(request: NextRequest) {
	const acceptHeader = request.headers.get("accept")
	return acceptHeader?.includes("text/html")
}

/**
 * Generates the Link header for the available language versions of the current page.
 */
export function generateLinkHeader<T extends string>(
	strategy: RoutingStragey<T>,
	{
		canonicalPath,
		availableLanguageTags,
		request,
	}: {
		canonicalPath: string
		availableLanguageTags: readonly T[]
		request: NextRequest
	}
): string {
	const alternates: string[] = []

	for (const lang of availableLanguageTags) {
		const localizedUrl = strategy.getLocalisedUrl(canonicalPath, lang, lang)
		localizedUrl.pathname = encodeURI(localizedUrl.pathname || "")
		localizedUrl.pathname = addPathPrefix(localizedUrl.pathname, request.nextUrl.basePath)

		//withBase should be an absolute path, so this should never do relative path resolution
		const fullHref = format(localizedUrl)
		alternates.push(`<${fullHref}>; rel="alternate"; hreflang="${lang}"`)
	}

	return alternates.join(", ")
}
