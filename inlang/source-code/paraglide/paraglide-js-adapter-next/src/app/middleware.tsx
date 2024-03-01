import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { sourceLanguageTag, availableLanguageTags } from "$paraglide/runtime.js"
import { HeaderNames } from "../constants"
import type { RoutingStrategy } from "./routing/prefix"

export function createMiddleware<T extends string>(
	exclude: (path: string) => boolean,
	strategy: RoutingStrategy<T>
) {
	/**
	 * Sets the request headers to resolve the language tag in RSC.
	 * https://nextjs.org/docs/pages/building-your-application/routing/middleware#setting-headers
	 */
	return function middleware(request: NextRequest) {
		const localisedPathname = decodeURI(request.nextUrl.pathname)

		const locale = strategy.getLocaleFromLocalisedPath(localisedPathname) ?? sourceLanguageTag

		const canonicalPath = strategy.translatePath(localisedPathname, sourceLanguageTag as T)
		if (exclude(canonicalPath)) return NextResponse.next()

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
		const alternates: string[] = []

		for (const lang of availableLanguageTags) {
			const translatedPathname = strategy.translatePath(canonicalPath, lang)
			const encodedPathname = encodeURI(translatedPathname)
			alternates.push(`<${encodedPathname}>; rel="alternate"; hreflang="${lang}"`)
		}

		return alternates.join(", ")
	}
}
