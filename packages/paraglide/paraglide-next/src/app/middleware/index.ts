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
import type { RoutingStrategy } from "../routing-strategy/interface"
import type { NextURL } from "next/dist/server/web/next-url"
import { createCookieDetection } from "./detection/CookieDetection"
import { createAcceptLanguageDetection } from "./detection/AcceptLanguageDetection"

export type MiddlewareOptions<T extends string> = {
	/**
	 * The routing strategy used for determining the language and page to render
	 */
	strategy: RoutingStrategy<T>

	/**
	 * If a redirect should occur when the detected language does not match the path
	 *
	 * @example
	 * - A request is made to /about.
	 * - The routing strategy is ambiguous & falls back to language detection
	 * - Language is set to `de`
	 * - The localised path would be /de/ueber-uns
	 * - If redirect is true, the request will be redirected to /de/ueber-uns, otherwise it will stay
	 *
	 * @default true
	 */
	redirect?: boolean
}

type OptionalProps<T> = {
	[K in keyof T]-?: Record<string, never> extends { [P in K]: T[K] } ? K : never
}[keyof T]

type MaybeMissingOptions<T> = Pick<Required<T>, OptionalProps<T>>

const middlewareOptionDefaults: MaybeMissingOptions<MiddlewareOptions<string>> = {
	redirect: true,
}

export function Middleware<T extends string>(opt: MiddlewareOptions<T>) {
	opt = { ...middlewareOptionDefaults, ...opt }

	/**
	 * Sets the request headers to resolve the language tag in RSC.
	 * https://nextjs.org/docs/pages/building-your-application/routing/middleware#setting-headers
	 */
	return function middleware(request: NextRequest) {
		const localeCookieValue = request.cookies.get(LANG_COOKIE.name)?.value
		const locale = resolveLanguage(request, sourceLanguageTag, [
			opt.strategy.resolveLocale,
			createCookieDetection({ availableLanguageTags: availableLanguageTags }),
			createAcceptLanguageDetection({ availableLanguageTags: availableLanguageTags }),
		]) as T

		const decodedPathname = decodeURI(request.nextUrl.pathname) as `/${string}`
		const canonicalPath = opt.strategy.getCanonicalPath(decodedPathname, locale)
		const localisedURL = opt.strategy.getLocalisedUrl(canonicalPath, locale, false)

		const localeCookieMatches =
			isAvailableLanguageTag(localeCookieValue) && localeCookieValue === locale

		const headers = new Headers(request.headers)
		headers.set(PARAGLIDE_LANGUAGE_HEADER_NAME, locale)

		const shouldRedirect = opt.redirect && localisedURL.pathname !== decodedPathname

		const rewriteRequired = request.nextUrl.pathname !== canonicalPath
		const response: NextResponse = shouldRedirect
			? redirect(request.nextUrl, localisedURL.pathname, { headers })
			: rewriteRequired
			? rewrite(request.nextUrl, canonicalPath, { request: { headers } })
			: NextResponse.next({ request: { headers } })

		// Update the locale-cookie
		if (!localeCookieMatches) {
			response.cookies.set(LANG_COOKIE.name, locale, {
				sameSite: LANG_COOKIE.SameSite,
				maxAge: LANG_COOKIE["Max-Age"],
				path: request.nextUrl.basePath || "/",
			})
		}

		if (shouldAddLinkHeader(request)) {
			const linkHeader = generateLinkHeader(opt.strategy, {
				availableLanguageTags: availableLanguageTags as T[],
				canonicalPath,
				request,
			})
			response.headers.set(LINK_HEADER_NAME, linkHeader)
		}

		return response
	}
}

const rewrite = (nextUrl: NextURL, pathname: string, init?: object): NextResponse => {
	const destination = nextUrl.clone()
	destination.pathname = pathname
	return NextResponse.rewrite(destination, init)
}

const redirect = (nextUrl: NextURL, pathname: string, init?: RequestInit): NextResponse => {
	const destination = nextUrl.clone()
	destination.pathname = pathname
	return NextResponse.redirect(destination, init)
}
