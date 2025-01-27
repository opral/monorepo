/**
 * Set the locale.
 *
 * @example
 *   setLocale('en');
 *
 * @type {(newLocale: Locale) => void}
 */
export let setLocale = (newLocale) => {
	// everything that is not the chosen strategy will be tree-shaken

	if (strategy.type === "custom") {
		// a default for a custom strategy to get started quickly
		// is likely overwritten by `defineSetLocale()`
		_locale = newLocale;
	}
	if (strategy.type === "cookie") {
		// set the cookie
		document.cookie = `${strategy.cookieName}=${newLocale}`;
	}

	if (strategy.type === "i18n-routing") {
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
	}
	return window.location.reload();
};
