import { describe, it, expect } from "vitest"
import { Middleware } from "./index"
import { PrefixStrategy } from "../index.client"
import { LANG_COOKIE, PARAGLIDE_LANGUAGE_HEADER_NAME } from "../constants"
import { NextRequest, NextResponse } from "next/server"
import { availableLanguageTags, sourceLanguageTag } from "$paraglide/runtime.js"
import { DomainStrategy } from "../routing-strategy/strats/domainStrategy"

describe("Middleware with Prefix", () => {
	const strategy = PrefixStrategy<"en" | "de">({})
	const middleware = Middleware({
		strategy,
	})

	it.each(availableLanguageTags)(
		"reroutes a request from /%s to / and sets the header",
		(languageTag) => {
			if (languageTag === sourceLanguageTag) return

			const request = new NextRequest("https://example.com/" + languageTag)
			const response = middleware(request)

			expectHeaderValue(response, PARAGLIDE_LANGUAGE_HEADER_NAME, languageTag)
			expectCookieValue(response, LANG_COOKIE.name, languageTag)
			expectRewriteDestination(response, "https://example.com/")
		}
	)

	it.each(availableLanguageTags)(
		"reroutes a request from /%s/some-page to /some-page and sets the header",
		(languageTag) => {
			if (languageTag === sourceLanguageTag) return

			const request = new NextRequest("https://example.com/" + languageTag + "/some-page")
			const response = middleware(request)

			expectHeaderValue(response, PARAGLIDE_LANGUAGE_HEADER_NAME, languageTag)
			expectCookieValue(response, LANG_COOKIE.name, languageTag)
			expectRewriteDestination(response, "https://example.com/some-page")
		}
	)
})

describe("Middleware with Domain Strategy", () => {
	const domains = {
		en: "https://example.com",
		de: "https://de.example.com",
	} as const

	const strategy = DomainStrategy<"en" | "de">({ domains })
	const middleware = Middleware({ strategy })

	it.each(availableLanguageTags)("Detects the language from the domain", (languageTag) => {
		const domain = domains[languageTag as keyof typeof domains]

		const request = new NextRequest(domain + "/some-page")
		const response = middleware(request)

		expectNoRewrite(response)
		expectNoRedirect(response)
		expectCookieValue(response, LANG_COOKIE.name, languageTag)
		expectHeaderValue(response, PARAGLIDE_LANGUAGE_HEADER_NAME, languageTag)
	})
})

describe("Middleware Fallbacks", () => {
	const middleware = Middleware({
		strategy: {
			resolveLocale() {
				return undefined //be completely indecicive
			},
			getCanonicalPath(path) {
				return path
			},
			getLocalisedUrl(canonicalPath) {
				return { pathname: canonicalPath }
			},
		},
		redirect: false,
	})

	it.each(availableLanguageTags)(
		"Uses the Language Cookie to detect the language, regardless of Accept-Language header",
		(languageTag) => {
			const headers = new Headers()
			headers.set("Cookie", LANG_COOKIE.name + "=" + languageTag)
			headers.set("Accept-Language", sourceLanguageTag) // to make sure the cookie takes precedence
			const request = new NextRequest("https://example.com/", { headers })
			const response = middleware(request)

			expectNoRewrite(response)
			expectHeaderValue(response, PARAGLIDE_LANGUAGE_HEADER_NAME, languageTag)
		}
	)

	it.each(availableLanguageTags)(
		"Uses the Accept-Language header to detect the language if no cookie is present",
		(languageTag) => {
			const headers = new Headers()
			headers.set("Accept-Language", languageTag)
			const request = new NextRequest("https://example.com/", { headers })
			const response = middleware(request)

			expectNoRewrite(response)
			expectCookieValue(response, LANG_COOKIE.name, languageTag)
			expectHeaderValue(response, PARAGLIDE_LANGUAGE_HEADER_NAME, languageTag)
		}
	)
})

/**
 * Checks if the response sets the header to the given value
 * @param response - A NextResponse
 * @param headerName - The name of the header to set
 * @param headerValue - The value to set it to
 */
function expectHeaderValue(response: NextResponse, headerName: string, headerValue: string) {
	const basicHeader = response.headers.get(headerName)
	if (basicHeader) {
		expect(basicHeader).toBe(headerValue)
		return
	}

	// On Redirect or Reroute Responses the headers are a bit weird
	// 'x-middleware-override-headers': 'x-language-tag', // lists the headers to overrride
	// 'x-middleware-request-x-language-tag': 'de' //provides the header
	expect(response.headers.get("x-middleware-override-headers")).includes(headerName)
	expect(response.headers.get("x-middleware-request-" + headerName)).toBe(headerValue)
}

function expectCookieValue(response: NextResponse, cookieName: string, cookieValue: string) {
	expect(response.cookies.get(cookieName)?.value).toBe(cookieValue)
}

/**
 * Checks if the given response rewrites to the given destination
 * @param response - A NextResponse
 * @param destination - A full href, including protocol
 */
function expectRewriteDestination(response: NextResponse, destination: string) {
	expect(response.headers.get("x-middleware-rewrite")).toBe(destination)
}

/**
 * Checks that the response doesn't rewrite
 */
function expectNoRewrite(response: NextResponse) {
	expect(response.headers.get("x-middleware-rewrite")).toBeNull()
}

/**
 * Checks if the given response redirects to the given destination
 */
/*
function expectRedirectTo(response: NextResponse, destination: string) {
	expect(response.headers.get("x-middleware-redirect")).toBe(destination)
}
*/

/**
 * Checks that the response doesn't redirect
 */
function expectNoRedirect(response: NextResponse) {
	expect(response.headers.get("x-middleware-redirect")).toBeNull()
}
