/**
 * Set the locale.
 *
 * @example
 *   setLocale('en');
 *
 * @type {(newLocale: Locale) => void}
 */
export let setLocale = (newLocale) => {
	if (strategy.type === "custom") {
		_locale = newLocale;
	}
	if (strategy.type === "cookie") {
		document.cookie = `${strategy.cookieName}=${newLocale}`;
	}
};
