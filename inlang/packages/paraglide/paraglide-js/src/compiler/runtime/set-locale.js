import { cookieName } from "./cookie-name.js";
import { localizePath } from "./localize-path.js";
import { strategy } from "./strategy.js";

/**
 * Set the locale.
 *
 * @example
 *   setLocale('en');
 *
 * @type {(newLocale: Locale) => void}
 */
export let setLocale = (newLocale) => {
	const strat = strategy[0];

	if (strat === "variable") {
		// a default for a custom strategy to get started quickly
		// is likely overwritten by `defineSetLocale()`
		_locale = newLocale;
	} else if (strat === "cookie") {
		if (isServer) {
			throw new Error(
				"Cookie strategy can't be set on the server because it relies on the `document` object."
			);
		}
		// set the cookie
		document.cookie = `${cookieName}=${newLocale}`;
	} else if (strat === "pathname") {
		if (isServer) {
			throw new Error(
				"Pathname strategy can't be set on the server because it relies on the `window` object."
			);
		}
		// route to the new locale
		//
		// this triggers a page reload but a user rarely
		// switches locales, so this should be fine.
		//
		// if the behavior is not desired, the implementation
		// can be overwritten by `defineSetLocale()` to avoid
		// a full page reload.
		window.location.pathname = localizePath(window.location.pathname, {
			locale: newLocale,
		});
		return;
	} else {
		throw new Error("Unknown strategy");
	}
	if (!isServer) {
		// Reload the page to render the new locale
		//
		// If the behavior is not desired, the implementation
		// can be overwritten by `defineSetLocale()` to avoid
		// a full page reload.
		return window.location.reload();
	}
	return;
};
