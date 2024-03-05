import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { availableLanguageTags } from "$paraglide/runtime.js"
import { HeaderNames } from "../constants"
import { addBasePath } from "./routing/basePath"
import type { RoutingStragey } from "./routing/strategy"

export function createMiddleware<T extends string>(
	exclude: (path: string) => boolean,
	strategy: RoutingStragey<T>
) {
	/**
	 * Sets the request headers to resolve the language tag in RSC.
	 * https://nextjs.org/docs/pages/building-your-application/routing/middleware#setting-headers
	 */
	return function middleware(request: NextRequest) {
		const locale = strategy.resolveLanguage(request)

		const localisedPathname = decodeURI(request.nextUrl.pathname)
		const canonicalPath = strategy.getCanonicalPath(localisedPathname)
		if (exclude(canonicalPath)) return NextResponse.next()

		const headers = new Headers(request.headers)
		headers.set(HeaderNames.ParaglideLanguage, locale)

		if (shouldAddLinkHeader(request)) {
			//set Link header for alternate language versions
			const linkHeader = generateLinkHeader({
				availableLanguageTags: availableLanguageTags as T[],
				canonicalPath,
				request,
			})

			headers.set(HeaderNames.Link, linkHeader)
		}

		if (canonicalPath !== request.nextUrl.pathname) {
			request.nextUrl.pathname = canonicalPath
			return NextResponse.rewrite(request.nextUrl, {
				headers,
			})
		} else {
			return NextResponse.next({
				request: {
					headers,
				},
			})
		}
	}

	/**
	 * Generates the Link header for the available language versions of the current page.
	 */
	function generateLinkHeader({
		canonicalPath,
		availableLanguageTags,
		request,
	}: {
		canonicalPath: string
		availableLanguageTags: readonly T[]
		request: NextRequest
	}): string {
		const alternates: string[] = []

		for (const lang of availableLanguageTags) {
			const translatedPathname = strategy.translatePath(canonicalPath, lang)
			const encodedPathname = encodeURI(translatedPathname)

			const withBase = addBasePath(encodedPathname, true)

			//withBase should be an absolute path, so this should never do relative path resolution
			const fullHref = new URL(withBase, request.nextUrl.href).href

			alternates.push(`<${fullHref}>; rel="alternate"; hreflang="${lang}"`)
		}

		return alternates.join(", ")
	}
}

function shouldAddLinkHeader(request: NextRequest) {
	const acceptHeader = request.headers.get("accept")
	return acceptHeader?.includes("text/html")
}
