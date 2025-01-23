import { NextResponse } from "next/server";
import { baseLocale, deLocalizedPath, getLocaleFromPath } from "./runtime.js";

/**
 *
 * @param {import("next/server").NextRequest} request
 */
export async function middleware(request) {
	const locale = getLocaleFromPath(request.nextUrl.pathname) ?? baseLocale;

	const path = deLocalizedPath(request.nextUrl.pathname);

	if (request.nextUrl.pathname.startsWith("/_next")) {
		return NextResponse.next();
	}

	return NextResponse.rewrite(new URL(path, request.url), {
		headers: {
			"x-paraglide-locale": locale,
		},
	});
}
