import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import {
	availableLanguageTags,
	sourceLanguageTag,
} from "$paraglide-adapter-next-internal/runtime.js"
import { LANGUAGE_HEADER } from "./contsants"

/**
 * Sets the request headers to resolve the language tag in RSC.
 * https://nextjs.org/docs/pages/building-your-application/routing/middleware#setting-headers
 */
export function paraglideMiddleware(request: NextRequest) {
	//Get's the first segment of the URL path
	const maybeLocale = request.nextUrl.pathname.split("/")[1]

	//If it's not a valid language tag, redirect to the source language
	if (!availableLanguageTags.includes(maybeLocale as any)) {
		const redirectUrl = `/${sourceLanguageTag}${request.nextUrl.pathname}`
		request.nextUrl.pathname = redirectUrl
		return NextResponse.redirect(request.nextUrl)
	}

	//it _IS_ a valid language tag, so set the language tag header
	const locale = maybeLocale

	const headers = new Headers(request.headers)
	headers.set(LANGUAGE_HEADER, locale)

	return NextResponse.next({
		request: {
			headers,
		},
	})
}
