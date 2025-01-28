import { NextResponse } from "next/server";
import { deLocalizePath, detectLocaleFromRequest } from "./runtime.js";

/**
 *
 * @param {import("next/server").NextRequest} request
 */
export async function middleware(request) {
	const locale = detectLocaleFromRequest({
		pathname: request.nextUrl.pathname,
		headers: {},
		cookies: Object.fromEntries(
			request.cookies.getAll().map((cookie) => [cookie.name, cookie.value])
		),
	});

	// in case of i18n routing strategy, we need the delocalized path
	const path = deLocalizePath(request.nextUrl.pathname);

	if (request.nextUrl.pathname.startsWith("/_next")) {
		return NextResponse.next();
	}

	return NextResponse.rewrite(new URL(path, request.url), {
		headers: {
			"x-paraglide-locale": locale,
		},
	});
}
