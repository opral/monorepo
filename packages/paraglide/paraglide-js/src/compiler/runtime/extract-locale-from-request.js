import { assertIsLocale } from "./assert-is-locale.js";
import { extractLocaleFromHeader } from "./extract-locale-from-header.js";
import { extractLocaleFromUrl } from "./extract-locale-from-url.js";
import { isLocale } from "./is-locale.js";
import { customServerStrategies, isCustomStrategy } from "./strategy.js";
import {
	baseLocale,
	cookieName,
	strategy,
	TREE_SHAKE_COOKIE_STRATEGY_USED,
	TREE_SHAKE_PREFERRED_LANGUAGE_STRATEGY_USED,
	TREE_SHAKE_URL_STRATEGY_USED,
} from "./variables.js";

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
 * TODO: make this async in next major release and deprecate `extractLocaleFromRequest`
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
		} else if (TREE_SHAKE_URL_STRATEGY_USED && strat === "url") {
			locale = extractLocaleFromUrl(request.url);
		} else if (
			TREE_SHAKE_PREFERRED_LANGUAGE_STRATEGY_USED &&
			strat === "preferredLanguage"
		) {
			locale = extractLocaleFromHeader(request);
		} else if (strat === "globalVariable") {
			locale = _locale;
		} else if (strat === "baseLocale") {
			return baseLocale;
		} else if (strat === "localStorage") {
			continue;
		} else if (isCustomStrategy(strat) && customServerStrategies.has(strat)) {
			const handler = customServerStrategies.get(strat);
			locale = handler.getLocale(request);
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
