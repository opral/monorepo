import { NextResponse } from "next/server"
import {
	availableLanguageTags,
	isAvailableLanguageTag,
	sourceLanguageTag,
} from "$paraglide/runtime.js"
import { generateLinkHeader, shouldAddLinkHeader } from "./linkHeader"
import { LANG_COOKIE, PARAGLIDE_LANGUAGE_HEADER_NAME, LINK_HEADER_NAME } from "../constants"
import { resolveLanguage } from "./resolveLanguage"
import type { NextRequest } from "next/server"
import type { RoutingStragey } from "../routing/interface"
import type { NextURL } from "next/dist/server/web/next-url"
import { createCookieDetection } from "./detection/CookieDetection"
import { createAcceptLanguageDetection } from "./detection/AcceptLanguageDetection"

export function createMiddleware<T extends string>({ strategy }: { strategy: RoutingStragey<T> }) {
	/**
	 * Sets the request headers to resolve the language tag in RSC.
	 * https://nextjs.org/docs/pages/building-your-application/routing/middleware#setting-headers
	 */
	return function middleware(request: NextRequest) {
		const localeCookeValue = request.cookies.get(LANG_COOKIE.name)?.value
		const locale = resolveLanguage(request, sourceLanguageTag, [
			strategy.resolveLocale,
			createCookieDetection({ availableLanguageTags: availableLanguageTags }),
			createAcceptLanguageDetection({ availableLanguageTags: availableLanguageTags }),
		]) as T

		const decodedPathname = decodeURI(request.nextUrl.pathname)
		const canonicalPath = strategy.getCanonicalPath(decodedPathname, locale)
		const localisedPathname = strategy.getLocalisedUrl(canonicalPath, locale, false)

		const shouldRedirect = localisedPathname.pathname !== decodedPathname

		const localeCookieMatches =
			isAvailableLanguageTag(localeCookeValue) && localeCookeValue === locale

		const headers = new Headers(request.headers)
		headers.set(PARAGLIDE_LANGUAGE_HEADER_NAME, locale)

		const rewriteRequired = request.nextUrl.pathname !== canonicalPath
		const requestInit: RequestInit = {
			headers,
		}

		const response: NextResponse = shouldRedirect
			? redirect(request.nextUrl, localisedPathname.pathname || canonicalPath, requestInit)
			: rewriteRequired
			? rewrite(request.nextUrl, canonicalPath, requestInit)
			: NextResponse.next(requestInit)

		// Update the locale-cookie
		if (!localeCookieMatches) {
			response.cookies.set(LANG_COOKIE.name, locale, {
				sameSite: LANG_COOKIE.SameSite,
				maxAge: LANG_COOKIE["Max-Age"],
				path: request.nextUrl.basePath || undefined,
			})
		}

		if (shouldAddLinkHeader(request)) {
			const linkHeader = generateLinkHeader(strategy, {
				availableLanguageTags: availableLanguageTags as T[],
				canonicalPath,
				request,
			})
			response.headers.set(LINK_HEADER_NAME, linkHeader)
		}

		return response
	}
}

const rewrite = (nextUrl: NextURL, pathname: string, init: RequestInit): NextResponse => {
	nextUrl.pathname = pathname
	return NextResponse.rewrite(nextUrl, init)
}

const redirect = (nextUrl: NextURL, pathname: string, init: RequestInit): NextResponse => {
	nextUrl.pathname = pathname
	return NextResponse.redirect(nextUrl, init)
}
