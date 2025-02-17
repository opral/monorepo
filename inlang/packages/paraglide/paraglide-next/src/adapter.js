import { NextResponse } from "next/server";
import {
	deLocalizeUrl,
	extractLocaleFromRequest,
	strategy,
} from "./runtime.js";

/**
 *
 * @param {import("next/server").NextRequest} request
 */
export async function middleware(request) {
	const locale = extractLocaleFromRequest(request);

	// in case of pathname strategy, we need the delocalized
	// path for nextjs to match the page
	const deLocalizedUrl = strategy.includes("url")
		? deLocalizeUrl(request.nextUrl)
		: request.nextUrl;

	if (request.nextUrl.pathname.startsWith("/_next")) {
		return NextResponse.next();
	}

	return NextResponse.rewrite(deLocalizedUrl, {
		headers: {
			"x-paraglide-locale": locale,
		},
	});
}
