export { middleware } from "@inlang/paraglide-js-adapter-next"

export const config = {
	//Must be hardcoded string
	matcher: ["/", `/(de|en|de-CH)/:path*`],
}
