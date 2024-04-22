import { NextResponse } from "next/server"
import { availableLanguageTags, isAvailableLanguageTag } from "$paraglide/runtime.js"
import { generateLinkHeader, shouldAddLinkHeader } from "./linkHeader"
import { LANG_COOKIE, PARAGLIDE_LANGUAGE_HEADER_NAME, LINK_HEADER_NAME } from "../constants"
import { resolveLanguage } from "./resolveLanguage"
import type { NextRequest } from "next/server"
import type { RoutingStragey } from "../routing/interface"
import type { ResolvedI18nConfig } from "../config"
import type { NextURL } from "next/dist/server/web/next-url"

export function createMiddleware<T extends string>(
	config: ResolvedI18nConfig<T>,
	strategy: RoutingStragey<T>
) {
	/**
	 * Sets the request headers to resolve the language tag in RSC.
	 * https://nextjs.org/docs/pages/building-your-application/routing/middleware#setting-headers
	 */
	return function middleware(request: NextRequest) {
		const localeCookeValue = request.cookies.get(LANG_COOKIE.name)?.value
		const locale = resolveLanguage(request, config, strategy)

		const decodedPathname = decodeURI(request.nextUrl.pathname)
		const canonicalPath = strategy.getCanonicalPath(decodedPathname, locale)
		const localisedPathname = strategy.getLocalisedPath(canonicalPath, locale, {
			isLocaleSwitch: false,
		})

		const shouldRedirect = localisedPathname !== decodedPathname

		const localeCookieMatches =
			isAvailableLanguageTag(localeCookeValue) && localeCookeValue === locale

		if (config.exclude(canonicalPath)) return NextResponse.next()

		const headers = new Headers(request.headers)
		headers.set(PARAGLIDE_LANGUAGE_HEADER_NAME, locale)

		const rewriteRequired = request.nextUrl.pathname !== canonicalPath
		const requestInit: RequestInit = {
			headers,
		}

		const response: NextResponse = shouldRedirect
			? redirect(request.nextUrl, localisedPathname, requestInit)
			: rewriteRequired
			? rewrite(request.nextUrl, canonicalPath, requestInit)
			: NextResponse.next(requestInit)

		// Update the locale-cookie
		if (!localeCookieMatches) {
			response.cookies.set(LANG_COOKIE.name, locale, {
				sameSite: LANG_COOKIE.sameSite,
				maxAge: LANG_COOKIE.maxAge,
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
