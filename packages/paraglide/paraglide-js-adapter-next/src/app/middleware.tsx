import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { sourceLanguageTag, availableLanguageTags } from "$paraglide/runtime.js"
import { HeaderNames } from "../constants"
import type { RoutingStrategy } from "./routing/prefix"

export function createMiddleware<T extends string>(strategy: RoutingStrategy<T>) {
	/**
	 * Sets the request headers to resolve the language tag in RSC.
	 * https://nextjs.org/docs/pages/building-your-application/routing/middleware#setting-headers
	 */
	return function middleware(request: NextRequest) {
		const locale =
			strategy.getLocaleFromLocalisedPath(request.nextUrl.pathname) ?? sourceLanguageTag

		const canonicalPath = strategy.translatePath(request.nextUrl.pathname, sourceLanguageTag)
		const headers = new Headers(request.headers)

		headers.set(HeaderNames.ParaglideLanguage, locale)

		//set Link header for alternate language versions
		const linkHeader = generateLinkHeader({
			availableLanguageTags: availableLanguageTags as T[],
			canonicalPath,
		})
		headers.set(HeaderNames.Link, linkHeader)

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
		availableLanguageTags: readonly T[]
	}): string {
		return availableLanguageTags
			.map(
				(lang) =>
					`<${strategy.getLocalisedPath(canonicalPath, lang)}>; rel="alternate"; hreflang="${lang}"`
			)
			.join(", ")
	}
}
