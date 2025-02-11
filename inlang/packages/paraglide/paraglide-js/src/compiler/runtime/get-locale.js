import { assertIsLocale } from "./assert-is-locale.js";
import {
	baseLocale,
	strategy,
	TREE_SHAKE_COOKIE_STRATEGY_USED,
	TREE_SHAKE_PATHNAME_STRATEGY_USED,
	TREE_SHAKE_GLOBAL_VARIABLE_STRATEGY_USED,
	domains,
} from "./variables.js";
import { extractLocaleFromCookie } from "./extract-locale-from-cookie.js";
import { extractLocaleFromPathname } from "./extract-locale-from-pathname.js";
import { extractLocaleFromUrl } from "./extract-locale-from-url.js";

/**
 * This is a fallback to get started with a custom
 * strategy and avoid type errors.
 *
 * The implementation is overwritten
 * by \`defineGetLocale()\` and \`defineSetLocale()\`.
 *
 * @type {Locale|undefined}
 */
let _locale;

/**
 * Get the current locale.
 *
 * @example
 *   if (getLocale() === 'de') {
 *     console.log('Germany 🇩🇪');
 *   } else if (getLocale() === 'nl') {
 *     console.log('Netherlands 🇳🇱');
 *   }
 *
 * @type {() => Locale}
 */
export let getLocale = () => {
	/** @type {string | undefined} */
	let locale;

	for (const strat of strategy) {
		if (TREE_SHAKE_COOKIE_STRATEGY_USED && strat === "cookie") {
			locale = extractLocaleFromCookie();
		} else if (strat === "baseLocale") {
			locale = baseLocale;
		} else if (domains && strat === "domain") {
			for (const [_locale, hostname] of Object.entries(domains)) {
				if (window.location.hostname === hostname) {
					locale = _locale;
				}
			}
		} else if (strat === "url") {
			locale = extractLocaleFromUrl(window.location.pathname);
		} else if (
			TREE_SHAKE_PATHNAME_STRATEGY_USED &&
			strat === "pathname" &&
			typeof window !== "undefined" &&
			window.location?.pathname
		) {
			locale = extractLocaleFromPathname(window.location.pathname);
		} else if (
			TREE_SHAKE_GLOBAL_VARIABLE_STRATEGY_USED &&
			strat === "globalVariable" &&
			_locale !== undefined
		) {
			locale = _locale;
		}
		// check if match, else continue loop
		if (locale !== undefined) {
			return assertIsLocale(locale);
		}
	}

	throw new Error("No locale found. There is an error in your strategy.");
};
