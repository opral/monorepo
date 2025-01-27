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
export let getLocale = (() => {
	if (strategy.type === "custom") {
		return () => _locale;
	}

	if (strategy.type === "cookie") {
		const cookieName = strategy.cookieName;
		return () => {
			const match = document.cookie.match(
				new RegExp(`(^| )${cookieName}=([^;]+)`)
			);
			return assertIsLocale(match?.[2] ?? baseLocale);
		};
	}

	// Default fallback for unsupported strategies
	return () => assertIsLocale("");
})();