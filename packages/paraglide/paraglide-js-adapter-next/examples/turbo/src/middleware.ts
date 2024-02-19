import { paraglideMiddleware } from "@inlang/paraglide-js-adapter-next"

export const middleware = paraglideMiddleware

export const config = {
	//Must be hardcoded string
	matcher: ["/", `/(de|en|de-CH)/:path*`],
}
