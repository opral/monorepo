import { getLocale } from "./get-locale.js";
import { localizeUrl } from "./localize-url.js";
import {
	cookieName,
	isServer,
	localStorageKey,
	strategy,
	TREE_SHAKE_COOKIE_STRATEGY_USED,
	TREE_SHAKE_GLOBAL_VARIABLE_STRATEGY_USED,
	TREE_SHAKE_LOCAL_STORAGE_STRATEGY_USED,
	TREE_SHAKE_URL_STRATEGY_USED,
} from "./variables.js";

/**
 * Set the locale.
 *
 * Set locale reloads the site by default on the client. Reloading
 * can be disabled by passing \`reload: false\` as an option. If
 * reloading is disabled, you need to ensure that the UI is updated
 * to reflect the new locale.
 *
 * cookieMaxAge Indicates the number of seconds until the cookie
 * expires.
 *
 * @example
 *   setLocale('en');
 *
 * @example
 *   setLocale('en', { reload: false, cookieMaxAge: 60*60*24*7 });
 *
 * @type {(newLocale: Locale, options?: { reload?: boolean, cookieMaxAge?: number }) => void}
 */
export let setLocale = (newLocale, options) => {
	const optionsWithDefaults = {
		reload: true,
		cookieMaxAge: 60 * 60 * 24 * 400, // 400 days is the max age limit by chrome: https://developer.chrome.com/blog/cookie-max-age-expires/
		...options,
	};
	// locale is already set
	// https://github.com/opral/inlang-paraglide-js/issues/430
	let currentLocale;
	try {
		currentLocale = getLocale();
	} catch {
		// do nothing, no locale has been set yet.
	}
	/** @type {string | undefined} */
	let newLocation = undefined;
	for (const strat of strategy) {
		if (
			TREE_SHAKE_GLOBAL_VARIABLE_STRATEGY_USED &&
			strat === "globalVariable"
		) {
			// a default for a custom strategy to get started quickly
			// is likely overwritten by `defineSetLocale()`
			_locale = newLocale;
		} else if (TREE_SHAKE_COOKIE_STRATEGY_USED && strat === "cookie") {
			if (isServer || typeof document === "undefined") {
				continue;
			}
			// set the cookie
			let cookie = `${cookieName}=${newLocale}; path=/`;
			if (options !== undefined) {
				if (options.cookieMaxAge !== undefined) {
					cookie += `; max-age=${options.cookieMaxAge}`;
				} else {
					cookie += `; max-age=${optionsWithDefaults.cookieMaxAge}`;
				}
			}
			document.cookie = cookie;
		} else if (strat === "baseLocale") {
			// nothing to be set here. baseLocale is only a fallback
			continue;
		} else if (
			TREE_SHAKE_URL_STRATEGY_USED &&
			strat === "url" &&
			typeof window !== "undefined"
		) {
			// route to the new url
			//
			// this triggers a page reload but a user rarely
			// switches locales, so this should be fine.
			//
			// if the behavior is not desired, the implementation
			// can be overwritten by `defineSetLocale()` to avoid
			// a full page reload.
			newLocation = localizeUrl(window.location.href, {
				locale: newLocale,
			}).href;
		} else if (
			TREE_SHAKE_LOCAL_STORAGE_STRATEGY_USED &&
			strat === "localStorage" &&
			typeof window !== "undefined"
		) {
			// set the localStorage
			localStorage.setItem(localStorageKey, newLocale);
		}
	}
	if (
		!isServer &&
		optionsWithDefaults.reload &&
		window.location &&
		newLocale !== currentLocale
	) {
		if (newLocation) {
			// reload the page by navigating to the new url
			window.location.href = newLocation;
		} else {
			// reload the page to reflect the new locale
			window.location.reload();
		}
	}

	return;
};

/**
 * Overwrite the \`setLocale()\` function.
 *
 * Use this function to overwrite how the locale is set. For example,
 * modify a cookie, env variable, or a user's preference.
 *
 * @example
 *   overwriteSetLocale((newLocale) => {
 *     // set the locale in a cookie
 *     return Cookies.set('locale', newLocale)
 *   });
 *
 * @param {(newLocale: Locale) => void} fn
 */
export const overwriteSetLocale = (fn) => {
	setLocale = fn;
};
