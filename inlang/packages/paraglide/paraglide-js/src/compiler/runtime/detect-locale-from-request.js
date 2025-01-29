/**
 * Detect a locale from a request.
 *
 * @example
 *   const locale = detectLocaleFromRequest({
 *      pathname: '/en/home',
 *      headers: {
 *        'accept-language': 'en'
 *      },
 *      cookies: {
 *        'PARAGLIDE_LOCALE': 'fr'
 *      }
 *   });
 *
 * @type {(args: { pathname: string, headers: Record<string, string>, cookies: Record<string, string> }) => Locale}
 */
export const detectLocaleFromRequest = (args) => {
	/** @type {string|undefined} */
	let locale;

	for (const strat of strategy) {
		if (strat === "cookie") {
			locale = args.cookies[cookieName];
		} else if (strat === "pathname") {
			locale = localeInPath(args.pathname);
		} else if (strat === "custom") {
			throw new Error(
				"Custom strategy is not supported for detectLocaleFromRequest"
			);
		} else if (strat === "variable") {
			locale = _localeVariable;
		} else if (strat === "baseLocale") {
			return baseLocale;
		} else {
			throw new Error(`Unsupported strategy: ${strat}`);
		}
		if (locale !== undefined) {
			return assertIsLocale(locale);
		}
	}
	throw new Error(
		"No locale found. There is an error in your strategy. Try adding 'baseLocale' as the very last strategy."
	);
};
