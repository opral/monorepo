import { assertIsLocale } from "./assert-is-locale.js";
import {
	baseLocale,
	cookieName,
	strategy,
	TREE_SHAKE_URL_PATTERN_STRATEGY_USED,
} from "./variables.js";
import { extractLocaleFromUrl } from "./extract-locale-from-url.js";

/**
 * Detect a locale from a request.
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
		if (strat === "cookie") {
			locale = request.headers
				.get("cookie")
				?.split("; ")
				.find((c) => c.startsWith(cookieName + "="))
				?.split("=")[1];
		} else if (TREE_SHAKE_URL_PATTERN_STRATEGY_USED && strat === "urlPattern") {
			locale = extractLocaleFromUrl(request.url);
		} else if (strat === "globalVariable") {
			locale = _locale;
		} else if (strat === "baseLocale") {
			return baseLocale;
		} else {
			throw new Error(`Unsupported strategy: ${strat}`);
		}
		if (locale !== undefined) {
			return assertIsLocale(locale);
		}
	}
	throw new Error(
		"No locale found. There is an error in your strategy. Try adding 'baseLocale' as the very last strategy."
	);
};
