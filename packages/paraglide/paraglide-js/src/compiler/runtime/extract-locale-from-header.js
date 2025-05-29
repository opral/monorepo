import { isLocale } from "./is-locale.js";

/**
 * Extracts a locale from the accept-language header.
 *
 * Use the function on the server to extract the locale
 * from the accept-language header that is sent by the client.
 *
 * @example
 *   const locale = extractLocaleFromHeader(request);
 *
 * @type {(request: Request) => Locale}
 * @param {Request} request - The request object to extract the locale from.
 * @returns {string|undefined} The negotiated preferred language.
 */
export function extractLocaleFromHeader(request) {
	const acceptLanguageHeader = request.headers.get("accept-language");
	if (acceptLanguageHeader) {
		// Parse language preferences with their q-values and base language codes
		const languages = acceptLanguageHeader
			.split(",")
			.map((lang) => {
				const [tag, q = "1"] = lang.trim().split(";q=");
				// Get both the full tag and base language code
				const baseTag = tag?.split("-")[0]?.toLowerCase();
				return {
					fullTag: tag?.toLowerCase(),
					baseTag,
					q: Number(q),
				};
			})
			.sort((a, b) => b.q - a.q);

		for (const lang of languages) {
			if (isLocale(lang.fullTag)) {
				return lang.fullTag;
			} else if (isLocale(lang.baseTag)) {
				return lang.baseTag;
			}
		}

		return undefined;
	}

	return undefined;
}
