import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { sourceLanguageTag, isAvailableLanguageTag } from "@/paraglide/runtime"

/**
 * Sets the request headers to resolve the language tag in RSC.
 * https://nextjs.org/docs/pages/building-your-application/routing/middleware#setting-headers
 */
export const middleware = (request: NextRequest) => {
	console.log("paraglideMiddleware")
	//Get's the first segment of the URL path
	const maybeLocale = request.nextUrl.pathname.split("/")[1]

	const locale = isAvailableLanguageTag(maybeLocale) ? maybeLocale : sourceLanguageTag
	const headers = new Headers(request.headers)

	headers.set("x-language-tag", locale)
	return NextResponse.next({
		request: {
			headers,
		},
	})
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
