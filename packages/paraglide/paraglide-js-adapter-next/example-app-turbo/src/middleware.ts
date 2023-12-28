import { paraglideMiddleware } from "@inlang/paraglide-js-adapter-next/middleware"

export const middleware = paraglideMiddleware

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
