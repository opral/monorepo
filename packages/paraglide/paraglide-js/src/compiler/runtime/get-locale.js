import { assertIsLocale } from "./assert-is-locale.js";
import { isLocale } from "./is-locale.js";
import {
	baseLocale,
	strategy,
	serverAsyncLocalStorage,
	TREE_SHAKE_COOKIE_STRATEGY_USED,
	TREE_SHAKE_GLOBAL_VARIABLE_STRATEGY_USED,
	TREE_SHAKE_PREFERRED_LANGUAGE_STRATEGY_USED,
	TREE_SHAKE_URL_STRATEGY_USED,
	TREE_SHAKE_LOCAL_STORAGE_STRATEGY_USED,
	localStorageKey,
	isServer,
} from "./variables.js";
import { extractLocaleFromCookie } from "./extract-locale-from-cookie.js";
import { extractLocaleFromUrl } from "./extract-locale-from-url.js";

/**
 * This is a fallback to get started with a custom
 * strategy and avoid type errors.
 *
 * The implementation is overwritten
 * by \`overwriteGetLocale()\` and \`defineSetLocale()\`.
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

	// if running in a server-side rendering context
	// retrieve the locale from the async local storage
	if (serverAsyncLocalStorage) {
		const locale = serverAsyncLocalStorage?.getStore()?.locale;
		if (locale) {
			return locale;
		}
	}

	for (const strat of strategy) {
		if (TREE_SHAKE_COOKIE_STRATEGY_USED && strat === "cookie") {
			locale = extractLocaleFromCookie();
		} else if (strat === "baseLocale") {
			locale = baseLocale;
		} else if (
			TREE_SHAKE_URL_STRATEGY_USED &&
			strat === "url" &&
			typeof window !== "undefined"
		) {
			locale = extractLocaleFromUrl(window.location.href);
		} else if (
			TREE_SHAKE_GLOBAL_VARIABLE_STRATEGY_USED &&
			strat === "globalVariable" &&
			_locale !== undefined
		) {
			locale = _locale;
		} else if (
			TREE_SHAKE_PREFERRED_LANGUAGE_STRATEGY_USED &&
			strat === "preferredLanguage" &&
			typeof window !== "undefined"
		) {
			locale = negotiatePreferredLanguageFromNavigator();
		} else if (
			TREE_SHAKE_LOCAL_STORAGE_STRATEGY_USED &&
			strat === "localStorage" &&
			!isServer
		) {
			locale = localStorage.getItem(localStorageKey) ?? undefined;
		}
		// check if match, else continue loop
		if (locale !== undefined) {
			return assertIsLocale(locale);
		}
	}

	throw new Error(
		"No locale found. Read the docs https://inlang.com/m/gerre34r/library-inlang-paraglideJs/errors#no-locale-found"
	);
};

/**
 * Negotiates a preferred language from navigator.languages.
 *
 * @returns {string|undefined} The negotiated preferred language.
 */
function negotiatePreferredLanguageFromNavigator() {
	if (!navigator?.languages?.length) {
		return undefined;
	}

	const languages = navigator.languages.map((lang) => ({
		fullTag: lang.toLowerCase(),
		baseTag: lang.split("-")[0]?.toLowerCase(),
	}));

	for (const lang of languages) {
		if (isLocale(lang.fullTag)) {
			return lang.fullTag;
		} else if (isLocale(lang.baseTag)) {
			return lang.baseTag;
		}
	}

	return undefined;
}

/**
 * Overwrite the \`getLocale()\` function.
 *
 * Use this function to overwrite how the locale is resolved. For example,
 * you can resolve the locale from the browser's preferred language,
 * a cookie, env variable, or a user's preference.
 *
 * @example
 *   overwriteGetLocale(() => {
 *     // resolve the locale from a cookie. fallback to the base locale.
 *     return Cookies.get('locale') ?? baseLocale
 *   }
 *
 * @type {(fn: () => Locale) => void}
 */
export const overwriteGetLocale = (fn) => {
	getLocale = fn;
};
