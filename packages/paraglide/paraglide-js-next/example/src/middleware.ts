import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Sets the request headers to resolve the language tag in RSC.
 *
 * https://nextjs.org/docs/pages/building-your-application/routing/middleware#setting-headers
 */
export function middleware(request: NextRequest) {
	const languageTag = request.nextUrl.pathname.slice(1)

	const headers = new Headers(request.headers)

	headers.set("x-language-tag", languageTag)

	return NextResponse.next({
		request: {
			headers,
		},
	})
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico).*)",
	],
}
