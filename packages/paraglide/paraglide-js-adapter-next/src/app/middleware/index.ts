import { NextResponse } from "next/server"
import { availableLanguageTags, isAvailableLanguageTag } from "$paraglide/runtime.js"
import { generateLinkHeader, shouldAddLinkHeader } from "./linkHeader"
import { HeaderNames, LANG_COOKIE } from "../constants"
import type { NextRequest } from "next/server"
import type { RoutingStragey } from "../routing/interface"
import type { ResolvedI18nConfig } from "../config"

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
		const locale = strategy.resolveLanguage(request)

		const localisedPathname = decodeURI(request.nextUrl.pathname)
		const canonicalPath = strategy.getCanonicalPath(localisedPathname, locale)

		const localeCookieMatches =
			isAvailableLanguageTag(localeCookeValue) && localeCookeValue === locale

		if (config.exclude(canonicalPath)) return NextResponse.next()

		const headers = new Headers(request.headers)
		headers.set(HeaderNames.ParaglideLanguage, locale)

		if (shouldAddLinkHeader(request)) {
			const linkHeader = generateLinkHeader(strategy, {
				availableLanguageTags: availableLanguageTags as T[],
				canonicalPath,
				request,
				currentLocale: locale,
			})
			headers.set(HeaderNames.Link, linkHeader)
		}

		const rewriteRequired = request.nextUrl.pathname !== canonicalPath
		const requestInit: RequestInit = {
			headers,
		}

		const response: NextResponse = rewriteRequired
			? NextResponse.rewrite(
					{ ...request.nextUrl, pathname: canonicalPath } as typeof request.nextUrl,
					requestInit
			  )
			: NextResponse.next(requestInit)

		// Update the locale-cookie
		if (!localeCookieMatches) {
			response.cookies.set(LANG_COOKIE.name, locale, {
				sameSite: LANG_COOKIE.sameSite,
				maxAge: LANG_COOKIE.maxAge,
				path: request.nextUrl.basePath || undefined,
			})
		}

		return response
	}
}
