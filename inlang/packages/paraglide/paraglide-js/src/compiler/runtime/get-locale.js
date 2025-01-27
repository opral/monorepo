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
export const getLocale = () => {
	// the bundler will tree-shake unused strategies
	if (strategy.type === "cookie") {
		return assertIsLocale(
			document.cookie.match(
				new RegExp(`(^| )${strategy.cookieName}=([^;]+)`)
			)?.[2]
		);
	}
	return assertIsLocale("");
};
