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
import { localizeUrl } from "./localize-url.js";
import { getLocale } from "./get-locale.js";

/**
 * Set the locale.
 *
 * @example
 *   setLocale('en');
 *
 * @type {(newLocale: Locale) => void}
 */
export let setLocale = (newLocale) => {
	// locale is already set
	// https://github.com/opral/inlang-paraglide-js/issues/430
	let currentLocale;
	try {
		currentLocale = getLocale();
	} catch {
		// do nothing, no locale has been set yet.
	}
	if (newLocale === currentLocale) {
		return;
	}
	let localeHasBeenSet = false;
	for (const strat of strategy) {
		if (
			TREE_SHAKE_GLOBAL_VARIABLE_STRATEGY_USED &&
			strat === "globalVariable"
		) {
			// a default for a custom strategy to get started quickly
			// is likely overwritten by `defineSetLocale()`
			_locale = newLocale;
			localeHasBeenSet = true;
		} else if (TREE_SHAKE_COOKIE_STRATEGY_USED && strat === "cookie") {
			if (isServer) {
				continue;
			}
			// set the cookie
			document.cookie = `${cookieName}=${newLocale}; path=/`;
			localeHasBeenSet = true;
		} else if (strat === "baseLocale") {
			// nothing to be set here. baseLocale is only a fallback
			continue;
		} else if (TREE_SHAKE_URL_STRATEGY_USED && strat === "url" && !isServer) {
			// route to the new url
			//
			// this triggers a page reload but a user rarely
			// switches locales, so this should be fine.
			//
			// if the behavior is not desired, the implementation
			// can be overwritten by `defineSetLocale()` to avoid
			// a full page reload.
			window.location.href = localizeUrl(window.location.href, {
				locale: newLocale,
			}).href;
			// just in case return. the browser reloads the page by setting href
			return;
		} else if (
			TREE_SHAKE_LOCAL_STORAGE_STRATEGY_USED &&
			strat === "localStorage" &&
			!isServer
		) {
			// set the localStorage
			localStorage.setItem(localStorageKey, newLocale);
			localeHasBeenSet = true;
		}
	}
	if (localeHasBeenSet === false) {
		throw new Error(
			"No strategy was able to set the locale. This can happen if you use browser-based strategies like `cookie` in a server-side rendering environment. Overwrite setLocale() on the server to avoid this error."
		);
	} else if (!isServer && window.location) {
		// reload the page to reflect the new locale
		window.location.reload();
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
