import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { availableLanguageTags, sourceLanguageTag } from "./paraglide/runtime"

/**
 * Sets the request headers to resolve the language tag in RSC.
 *
 * https://nextjs.org/docs/pages/building-your-application/routing/middleware#setting-headers
 */
export function middleware(request: NextRequest) {
	const languageTag = request.nextUrl.pathname.slice(1)
	const [_, maybeLocale] = request.nextUrl.pathname.split("/")

	if (!availableLanguageTags.includes(maybeLocale as any)) {
		const redirectUrl = `/${sourceLanguageTag}${request.nextUrl.pathname}`
		request.nextUrl.pathname = redirectUrl
		return NextResponse.redirect(request.nextUrl)
	}

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
