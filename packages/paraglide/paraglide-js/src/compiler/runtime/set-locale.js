/**
 * Set the locale.
 *
 * @example
 *   setLocale('en');
 *
 * @param {Locale} newLocale
 * @type {(newLocale: Locale) => void}
 */
export const setLocale = (newLocale) => {
	if (strategy.type === "cookie") {
		document.cookie = `${strategy.cookieName}=${newLocale}`;
	}
};
