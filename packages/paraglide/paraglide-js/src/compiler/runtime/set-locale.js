import { getLocale } from "./get-locale.js";
import { localizeUrl } from "./localize-url.js";
import { customClientStrategies, isCustomStrategy } from "./strategy.js";
import {
	cookieDomain,
	cookieMaxAge,
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
 * Navigates to the localized URL, or reloads the current page
 *
 * @param {string} [newLocation] The new location
 * @return {undefined}
 */
const navigateOrReload = (newLocation) => {
	if (newLocation) {
		// reload the page by navigating to the new url
		window.location.href = newLocation;
	} else {
		// reload the page to reflect the new locale
		window.location.reload();
	}
};

/**
 * @typedef {(newLocale: Locale, options?: { reload?: boolean }) => void | Promise<void>} SetLocaleFn
 */

/**
 * Set the locale.
 *
 * Set locale reloads the site by default on the client. Reloading
 * can be disabled by passing \`reload: false\` as an option. If
 * reloading is disabled, you need to ensure that the UI is updated
 * to reflect the new locale.
 *
 * If any custom strategy's \`setLocale\` function is async, then this
 * function will become async as well.
 *
 * @example
 *   setLocale('en');
 *
 * @example
 *   setLocale('en', { reload: false });
 *
 * @type {SetLocaleFn}
 */
export let setLocale = (newLocale, options) => {
	const optionsWithDefaults = {
		reload: true,
		...options,
	};
	// locale is already set
	// https://github.com/opral/inlang-paraglide-js/issues/430
	/** @type {Locale | undefined} */
	let currentLocale;
	try {
		currentLocale = getLocale();
	} catch {
		// do nothing, no locale has been set yet.
	}
	/** @type {Array<Promise<any>>} */
	const customSetLocalePromises = [];
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
			if (
				isServer ||
				typeof document === "undefined" ||
				typeof window === "undefined"
			) {
				continue;
			}

			// set the cookie
			const cookieString = `${cookieName}=${newLocale}; path=/; max-age=${cookieMaxAge}`;
			document.cookie = cookieDomain
				? `${cookieString}; domain=${cookieDomain}`
				: cookieString;
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
		} else if (isCustomStrategy(strat) && customClientStrategies.has(strat)) {
			const handler = customClientStrategies.get(strat);
			if (handler) {
				let result = handler.setLocale(newLocale);
				// Handle async setLocale
				if (result instanceof Promise) {
					result = result.catch((error) => {
						throw new Error(`Custom strategy "${strat}" setLocale failed.`, {
							cause: error,
						});
					});
					customSetLocalePromises.push(result);
				}
			}
		}
	}

	const runReload = () => {
		if (
			!isServer &&
			optionsWithDefaults.reload &&
			window.location &&
			newLocale !== currentLocale
		) {
			navigateOrReload(newLocation);
		}
	};

	if (customSetLocalePromises.length) {
		return Promise.all(customSetLocalePromises).then(() => {
			runReload();
		});
	}

	runReload();

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
 * @param {SetLocaleFn} fn
 */
export const overwriteSetLocale = (fn) => {
	setLocale = /** @type {SetLocaleFn} */ (fn);
};
