import { describe, it, expect } from "vitest"
import { createMiddleware } from "./index"
import { PrefixStrategy } from "../index.client"
import { LANG_COOKIE, PARAGLIDE_LANGUAGE_HEADER_NAME } from "../constants"
import { NextRequest, NextResponse } from "next/server"
import { availableLanguageTags } from "$paraglide/runtime.js"

describe("Middleware with Prefix & no redirect", () => {
	const strategy = PrefixStrategy()
	const middleware = createMiddleware({
		strategy,
		redirect: false,
	})

	it.each(availableLanguageTags)(
		"reroutes a request from /%s to / and sets the header",
		(languageTag) => {
			const request = new NextRequest("https://example.com/" + languageTag)
			const response = middleware(request)

			expectHeaderValue(response, PARAGLIDE_LANGUAGE_HEADER_NAME, languageTag)
			expectRewriteDestination(response, "https://example.com/")
		}
	)

	it.each(availableLanguageTags)(
		"reroutes a request from /%s/some-page to /some-page and sets the header",
		(languageTag) => {
			const request = new NextRequest("https://example.com/" + languageTag + "/some-page")
			const response = middleware(request)

			expectHeaderValue(response, PARAGLIDE_LANGUAGE_HEADER_NAME, languageTag)
			expectRewriteDestination(response, "https://example.com/some-page")
		}
	)

	it.each(availableLanguageTags)(
		"doesn't reroute a request from / & uses the Language Cookie to detect the language",
		(languageTag) => {
			const headers = new Headers()
			headers.set("Cookie", LANG_COOKIE.name + "=" + languageTag)
			const request = new NextRequest("https://example.com/", { headers })
			const response = middleware(request)

			expectNoRewrite(response)
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
	// Next Responses set the headers a bit weird
	// 'x-middleware-override-headers': 'x-language-tag', // lists the headers to overrride
	// 'x-middleware-request-x-language-tag': 'de' //provides the header
	expect(response.headers.get("x-middleware-override-headers")).includes(headerName)
	expect(response.headers.get("x-middleware-request-" + headerName)).toBe(headerValue)
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
function expectRedirectTo(response: NextResponse, destination: string) {
	expect(response.headers.get("x-middleware-redirect")).toBe(destination)
}
