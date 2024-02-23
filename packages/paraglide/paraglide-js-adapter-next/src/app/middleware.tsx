import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { sourceLanguageTag, availableLanguageTags } from "$paraglide/runtime.js"
import { LANGUAGE_HEADER } from "../constants"
import { prefixStrategy, type RoutingStrategy } from "./routing/prefix"

export const middleware = createMiddleware(
	prefixStrategy({
		availableLanguageTags,
		sourceLanguageTag,
		exclude: [],
	})
)

export function createMiddleware(strategy: RoutingStrategy) {
	/**
	 * Sets the request headers to resolve the language tag in RSC.
	 * https://nextjs.org/docs/pages/building-your-application/routing/middleware#setting-headers
	 */
	return function middleware(request: NextRequest) {
		const locale =
			strategy.getLocaleFromLocalisedPath(request.nextUrl.pathname) ?? sourceLanguageTag

		const canonicalPath = strategy.translatePath(request.nextUrl.pathname, sourceLanguageTag)
		const headers = new Headers(request.headers)

		headers.set(LANGUAGE_HEADER, locale)

		//set Link header for alternate language versions
		const linkHeader = generateLinkHeader({
			availableLanguageTags,
			canonicalPath,
		})
		headers.set("Link", linkHeader)

		if (canonicalPath !== request.nextUrl.pathname) {
			request.nextUrl.pathname = canonicalPath
			return NextResponse.rewrite(request.nextUrl, {
				headers,
			})
		}

		return NextResponse.next({
			request: {
				headers,
			},
		})
	}

	/**
	 * Generates the Link header for the available language versions of the current page.
	 */
	function generateLinkHeader({
		canonicalPath,
		availableLanguageTags,
	}: {
		canonicalPath: string
		availableLanguageTags: readonly string[]
	}): string {
		return availableLanguageTags
			.map(
				(lang) =>
					`<${strategy.getLocalisedPath(canonicalPath, lang)}>; rel="alternate"; hreflang="${lang}"`
			)
			.join(", ")
	}
}
