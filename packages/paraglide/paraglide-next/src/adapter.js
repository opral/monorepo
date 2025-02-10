import { NextResponse } from "next/server";
import { deLocalizePath, extractLocaleFromRequest } from "./runtime.js";

/**
 *
 * @param {import("next/server").NextRequest} request
 */
export async function middleware(request) {
	const locale = extractLocaleFromRequest(request);

	// in case of pathname strategy, we need the delocalized
	// path for nextjs to match the page
	const path = deLocalizePath(request.nextUrl.pathname);

	if (request.nextUrl.pathname.startsWith("/_next")) {
		return NextResponse.next();
	}

	return NextResponse.rewrite(
		new URL(path, request.url).toString() + request.nextUrl.search,
		{
			headers: {
				"x-paraglide-locale": locale,
			},
		}
	);
}
