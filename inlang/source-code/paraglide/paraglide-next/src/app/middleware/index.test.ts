import { describe, it, expect } from "vitest"
import { createMiddleware } from "./index"
import { PrefixStrategy } from "../index.client"
import { PARAGLIDE_LANGUAGE_HEADER_NAME } from "../constants"
import { NextRequest, NextResponse } from "next/server"

describe("Middleware with Prefix & no redirect", () => {
	const strategy = PrefixStrategy()
	const middleware = createMiddleware({
		strategy,
		redirect: false,
	})

	it("reroutes a request from /de to / and sets the header", () => {
		const request = new NextRequest("https://example.com/de")
		const response = middleware(request)

		expectHeaderValue(response, PARAGLIDE_LANGUAGE_HEADER_NAME, "de")
		expectRewriteDestination(response, "https://example.com/")
	})
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
