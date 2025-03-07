import { assertIsLocale } from "./assert-is-locale.js";
import {
	baseLocale,
	cookieName,
	strategy,
	TREE_SHAKE_COOKIE_STRATEGY_USED,
	TREE_SHAKE_PREFERRED_LANGUAGE_STRATEGY_USED,
	TREE_SHAKE_URL_STRATEGY_USED,
} from "./variables.js";
import { extractLocaleFromUrl } from "./extract-locale-from-url.js";
import { isLocale } from "./is-locale.js";

/**
 * Extracts a locale from a request.
 *
 * Use the function on the server to extract the locale
 * from a request.
 *
 * The function goes through the strategies in the order
 * they are defined. If a strategy returns an invalid locale,
 * it will fall back to the next strategy.
 *
 * @example
 *   const locale = extractLocaleFromRequest(request);
 *
 * @type {(request: Request) => Locale}
 */
export const extractLocaleFromRequest = (request) => {
	/** @type {string|undefined} */
	let locale;

	for (const strat of strategy) {
		if (TREE_SHAKE_COOKIE_STRATEGY_USED && strat === "cookie") {
			locale = request.headers
				.get("cookie")
				?.split("; ")
				.find((c) => c.startsWith(cookieName + "="))
				?.split("=")[1];
		} else if (
			TREE_SHAKE_URL_STRATEGY_USED &&
			strat === "url" &&
			// only process url strategy if request is a document
			// else it's api requests, etc.
			request.headers.get("Sec-Fetch-Dest") === "document"
		) {
			locale = extractLocaleFromUrl(request.url);
		} else if (
			TREE_SHAKE_PREFERRED_LANGUAGE_STRATEGY_USED &&
			strat === "preferredLanguage"
		) {
			const acceptLanguageHeader = request.headers.get("accept-language");
			if (acceptLanguageHeader) {
				locale = negotiatePreferredLanguageFromHeader(acceptLanguageHeader);
			}
		} else if (strat === "globalVariable") {
			locale = _locale;
		} else if (strat === "baseLocale") {
			return baseLocale;
		} else if (strat === "localStorage") {
			continue;
		}
		if (locale !== undefined) {
			if (!isLocale(locale)) {
				locale = undefined;
			} else {
				return assertIsLocale(locale);
			}
		}
	}
	throw new Error(
		"No locale found. There is an error in your strategy. Try adding 'baseLocale' as the very last strategy. Read more here https://inlang.com/m/gerre34r/library-inlang-paraglideJs/errors#no-locale-found"
	);
};

/**
 * Negotiates a preferred language from a header.
 *
 * @param {string} header - The header to negotiate from.
 * @returns {string|undefined} The negotiated preferred language.
 */
function negotiatePreferredLanguageFromHeader(header) {
	// Parse language preferences with their q-values and base language codes
	const languages = header
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
