import { NextRequest, NextResponse } from "next/server";
import { serverMiddleware } from "./paraglide/runtime";

export function middleware(request: NextRequest) {
	return serverMiddleware(request, ({ request, locale }) => {
		request.headers.set("x-paraglide-locale", locale);
		request.headers.set("x-paraglide-request-url", request.url);
		return NextResponse.rewrite(request.url, request);
	});
}
