import { paraglideMiddleware } from "@inlang/paraglide-js-adapter-next/middleware"
import { availableLanguageTags } from "@/paraglide/runtime"

export const middleware = paraglideMiddleware

export const config = {
	matcher: ["/", `/(${availableLanguageTags.join("|")})/:path*`],
}
