import { assertIsLocale } from "./assert-is-locale.js";
import { extractLocaleFromCookie } from "./extract-locale-from-cookie.js";
import { extractLocaleFromNavigator } from "./extract-locale-from-navigator.js";
import { extractLocaleFromUrl } from "./extract-locale-from-url.js";
import { setLocale } from "./set-locale.js";
import { customClientStrategies, isCustomStrategy } from "./strategy.js";
import {
	baseLocale,
	isServer,
	localStorageKey,
	serverAsyncLocalStorage,
	strategy,
	TREE_SHAKE_COOKIE_STRATEGY_USED,
	TREE_SHAKE_GLOBAL_VARIABLE_STRATEGY_USED,
	TREE_SHAKE_LOCAL_STORAGE_STRATEGY_USED,
	TREE_SHAKE_PREFERRED_LANGUAGE_STRATEGY_USED,
	TREE_SHAKE_URL_STRATEGY_USED,
} from "./variables.js";

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

let localeInitiallySet = false;

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
			!isServer &&
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
			!isServer
		) {
			locale = extractLocaleFromNavigator();
		} else if (
			TREE_SHAKE_LOCAL_STORAGE_STRATEGY_USED &&
			strat === "localStorage" &&
			!isServer
		) {
			locale = localStorage.getItem(localStorageKey) ?? undefined;
		} else if (isCustomStrategy(strat) && customClientStrategies.has(strat)) {
			const handler = customClientStrategies.get(strat);
			if (handler) {
				const result = handler.getLocale();
				// Handle both sync and async results - skip async in sync getLocale
				if (result instanceof Promise) {
					// Can't await in sync function, skip async strategies
					continue;
				}
				locale = result;
			}
		}
		// check if match, else continue loop
		if (locale !== undefined) {
			const asserted = assertIsLocale(locale);
			if (!localeInitiallySet) {
				_locale = asserted;
				// https://github.com/opral/inlang-paraglide-js/issues/455
				localeInitiallySet = true;
				setLocale(asserted, { reload: false });
			}
			return asserted;
		}
	}

	throw new Error(
		"No locale found. Read the docs https://inlang.com/m/gerre34r/library-inlang-paraglideJs/errors#no-locale-found"
	);
};

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
