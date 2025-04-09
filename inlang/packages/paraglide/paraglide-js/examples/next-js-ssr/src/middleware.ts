import { NextRequest, NextResponse } from "next/server";
import { paraglideMiddleware } from "./paraglide/server";

export function middleware(request: NextRequest) {
	return paraglideMiddleware(request, ({ request, locale }) => {
		request.headers.set("x-paraglide-locale", locale);
		request.headers.set("x-paraglide-request-url", request.url);
		return NextResponse.rewrite(request.url, request);
	});
}
