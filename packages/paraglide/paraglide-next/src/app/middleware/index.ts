import { NextResponse } from "next/server"
import {
	availableLanguageTags,
	isAvailableLanguageTag,
	sourceLanguageTag,
} from "$paraglide/runtime.js"
import { addSeoHeaders } from "./headers"
import { LANG_COOKIE, PARAGLIDE_LANGUAGE_HEADER_NAME } from "../constants"
import { createCookieDetection } from "./detection/CookieDetection"
import { createAcceptLanguageDetection } from "./detection/AcceptLanguageDetection"
import type { NextRequest } from "next/server"
import type { RoutingStrategy } from "../routing-strategy/interface"
import type { NextURL } from "next/dist/server/web/next-url"

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

	const cookieDetection = createCookieDetection<T>({
		availableLanguageTags: availableLanguageTags as readonly T[],
	})
	const acceptLanguageDetection = createAcceptLanguageDetection<T>({
		availableLanguageTags: availableLanguageTags as readonly T[],
	})

	const languageDetectors = [opt.strategy.resolveLocale, cookieDetection, acceptLanguageDetection]

	/**
	 * Detects the language that should be used for the request based on the
	 * routing strategy and language negotiation.
	 *
	 * @param request
	 * @returns
	 */
	function detectLanguage(request: NextRequest): T {
		for (const detector of languageDetectors) {
			const locale = detector(request)
			if (locale) return locale
		}
		return sourceLanguageTag as T
	}

	/**
	 * Creates an appropriate routing response for the given request
	 * and language.
	 *
	 * @param request - The request to respond to
	 * @param locale - The detected language
	 */
	function getResponse(request: NextRequest, locale: T): NextResponse {
		const decodedPathname = decodeURI(request.nextUrl.pathname) as `/${string}`
		const canonicalPath = opt.strategy.getCanonicalPath(decodedPathname, locale)
		const localisedURL = opt.strategy.getLocalisedUrl(canonicalPath, locale, false)

		const localeCookieValue = request.cookies.get(LANG_COOKIE.name)?.value
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

		addSeoHeaders(response.headers, {
			availableLanguageTags: availableLanguageTags as T[],
			canonicalPath,
			request,
			strategy: opt.strategy,
		})

		return response
	}

	/**
	 * Middleware for handling language detection, redirects and language cookies
	 *
	 * https://nextjs.org/docs/pages/building-your-application/routing/middleware#setting-headers
	 */
	function middleware(request: NextRequest) {
		const locale = detectLanguage(request)
		return getResponse(request, locale)
	}

	middleware.detectLanguage = detectLanguage
	middleware.getResponse = getResponse
	return middleware
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
