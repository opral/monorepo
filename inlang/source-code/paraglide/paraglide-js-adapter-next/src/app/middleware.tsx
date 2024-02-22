import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { sourceLanguageTag, availableLanguageTags } from "$paraglide/runtime.js"
import { LANGUAGE_HEADER } from "../constants"
import { prefixStrategy } from "./routing/prefix"

const { getLocaleFromLocalisedPath, translatePath, getCanonicalPath } = prefixStrategy(
	availableLanguageTags,
	sourceLanguageTag
)

/**
 * Sets the request headers to resolve the language tag in RSC.
 * https://nextjs.org/docs/pages/building-your-application/routing/middleware#setting-headers
 */
export function middleware(request: NextRequest) {
	const locale = getLocaleFromLocalisedPath(request.nextUrl.pathname) ?? sourceLanguageTag
	const canonicalPath = getCanonicalPath(request.nextUrl.pathname)
	const headers = new Headers(request.headers)

	headers.set(LANGUAGE_HEADER, locale)

	//set Link header for alternate language versions
	const linkHeader = generateLinkHeader({
		availableLanguageTags,
		localisedPathname: request.nextUrl.pathname,
	})
	headers.set("Link", linkHeader)

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
	localisedPathname,
	availableLanguageTags,
}: {
	localisedPathname: string
	availableLanguageTags: readonly string[]
}): string {
	return availableLanguageTags
		.map(
			(lang) => `<${translatePath(localisedPathname, lang)}>; rel="alternate"; hreflang="${lang}"`
		)
		.join(", ")
}
