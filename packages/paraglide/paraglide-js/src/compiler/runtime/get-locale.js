import { assertIsLocale } from "./assert-is-locale.js";
import {
	baseLocale,
	strategy,
	TREE_SHAKE_COOKIE_STRATEGY_USED,
	TREE_SHAKE_GLOBAL_VARIABLE_STRATEGY_USED,
	TREE_SHAKE_URL_PATTERN_STRATEGY_USED,
} from "./variables.js";
import { extractLocaleFromCookie } from "./extract-locale-from-cookie.js";
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
		} else if (TREE_SHAKE_URL_PATTERN_STRATEGY_USED && strat === "urlPattern" && typeof window !== "undefined") {
			locale = extractLocaleFromUrl(window.location.href);
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

/**
 * Define the \`getLocale()\` function.
 *
 * Use this function to define how the locale is resolved. For example,
 * you can resolve the locale from the browser's preferred language,
 * a cookie, env variable, or a user's preference.
 *
 * @example
 *   defineGetLocale(() => {
 *     // resolve the locale from a cookie. fallback to the base locale.
 *     return Cookies.get('locale') ?? baseLocale
 *   }
 *
 * @type {(fn: () => Locale) => void}
 */
export const defineGetLocale = (fn) => {
	getLocale = fn;
};