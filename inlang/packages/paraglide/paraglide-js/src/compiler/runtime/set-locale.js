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
		_localeVariable = newLocale;
	} else if (strat === "custom") {
		// a default for a custom strategy to get started quickly
		// is likely overwritten by `defineSetLocale()`
		_localeVariable = newLocale;
	} else if (strat === "cookie") {
		// set the cookie
		document.cookie = `${cookieName}=${newLocale}`;
	} else if (strat === "pathname") {
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
	// Reload the page to render the new locale
	//
	// If the behavior is not desired, the implementation
	// can be overwritten by `defineSetLocale()` to avoid
	// a full page reload.
	return window.location.reload();
};
