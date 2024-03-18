import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { availableLanguageTags } from "$paraglide/runtime.js"
import { HeaderNames, LANG_COOKIE } from "../constants"
import { addBasePath } from "./routing/basePath"
import type { RoutingStragey } from "./routing/interface"
import type { ResolvedI18nConfig } from "./config"

export function createMiddleware<T extends string>(
	config: ResolvedI18nConfig<T>,
	strategy: RoutingStragey<T>
) {
	/**
	 * Sets the request headers to resolve the language tag in RSC.
	 * https://nextjs.org/docs/pages/building-your-application/routing/middleware#setting-headers
	 */
	return function middleware(request: NextRequest) {
		const localeCooke = request.cookies.get(LANG_COOKIE)
		const locale = strategy.resolveLanguage(request)

		const localisedPathname = decodeURI(request.nextUrl.pathname)
		const canonicalPath = strategy.getCanonicalPath(localisedPathname, locale)
		if (config.exclude(canonicalPath)) return NextResponse.next()

		const headers = new Headers(request.headers)
		headers.set(HeaderNames.ParaglideLanguage, locale)

		if (shouldAddLinkHeader(request)) {
			//set Link header for alternate language versions
			const linkHeader = generateLinkHeader({
				availableLanguageTags: availableLanguageTags as T[],
				canonicalPath,
				request,
				currentLocale: locale,
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
		currentLocale,
	}: {
		canonicalPath: string
		availableLanguageTags: readonly T[]
		request: NextRequest
		currentLocale: T
	}): string {
		const alternates: string[] = []

		for (const lang of availableLanguageTags) {
			const translatedPathname = strategy.translatePath(canonicalPath, currentLocale, lang)
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
