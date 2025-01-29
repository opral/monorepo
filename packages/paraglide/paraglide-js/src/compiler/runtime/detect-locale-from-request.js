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
	const strat = strategy[0];

	if (strat === "cookie") {
		return assertIsLocale(
			args.cookies[/** @type {any} */ (strategy).cookieName] ?? baseLocale
		);
	}

	if (strat === "pathname") {
		return assertIsLocale(localeInPath(args.pathname) ?? baseLocale);
	}

	if (strat === "custom") {
		throw new Error(
			"Custom strategy is not supported for detectLocaleFromRequest"
		);
	}

	throw new Error(`Unsupported strategy: ${strat}`);
};
