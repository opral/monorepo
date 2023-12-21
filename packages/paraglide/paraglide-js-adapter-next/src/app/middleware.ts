import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import {
	sourceLanguageTag,
	isAvailableLanguageTag,
} from "$paraglide-adapter-next-internal/runtime.js"
import { LANGUAGE_HEADER } from "../constants"

/**
 * Sets the request headers to resolve the language tag in RSC.
 * https://nextjs.org/docs/pages/building-your-application/routing/middleware#setting-headers
 */
export function paraglideMiddleware(request: NextRequest) {
	//Get's the first segment of the URL path
	const maybeLocale = request.nextUrl.pathname.split("/")[1]

	const locale = isAvailableLanguageTag(maybeLocale) ? maybeLocale : sourceLanguageTag
	const headers = new Headers(request.headers)

	headers.set(LANGUAGE_HEADER, locale)
	return NextResponse.next({
		request: {
			headers,
		},
	})
}
