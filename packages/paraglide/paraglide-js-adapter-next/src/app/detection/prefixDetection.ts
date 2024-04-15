import { LanguageDetector } from "./interface"

export const prefixDetection: LanguageDetector<"en"> = {
	resolveLanguage(request) {
		const pathname = request.nextUrl.pathname
		return "en"
	},
}
