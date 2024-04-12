import type { NextRequest } from "next/server"
import { RoutingStragey } from "../routing/interface"
import { addPathPrefix } from "../utils/basePath"

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
		const localizedPathname = strategy.getLocalisedPath(canonicalPath, lang, {
			isLocaleSwitch: false,
		})

		const encodedPathname = encodeURI(localizedPathname)
		const withBase = addPathPrefix(encodedPathname, request.nextUrl.basePath)

		//withBase should be an absolute path, so this should never do relative path resolution
		const fullHref = new URL(withBase, request.nextUrl.href).href

		alternates.push(`<${fullHref}>; rel="alternate"; hreflang="${lang}"`)
	}

	return alternates.join(", ")
}
