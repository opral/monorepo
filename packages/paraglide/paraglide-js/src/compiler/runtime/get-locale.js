/**
 * This is a fallback to get started with a custom
 * strategy and avoid type errors.
 *
 * The implementation is overwritten
 * by \`defineGetLocale()\` and \`defineSetLocale()\`.
 *
 * @type {Locale}
 */
let _locale = "<replace>";

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
	if (strategy.type === "custom") {
		return _locale;
	}

	// the bundler will tree-shake unused strategies
	if (strategy.type === "cookie") {
		return assertIsLocale(
			document.cookie.match(
				new RegExp(`(^| )${strategy?.cookieName}=([^;]+)`)
			)?.[2]
		);
	}
	return assertIsLocale("");
};
