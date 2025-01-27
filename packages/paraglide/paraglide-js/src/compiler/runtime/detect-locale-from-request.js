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
	if (strategy.type === "cookie") {
		return assertIsLocale(
			args.cookies[/** @type {any} */ (strategy).cookieName] ?? baseLocale
		);
	}

	if (strategy.type === "i18n-routing") {
		return assertIsLocale(localeInPath(args.pathname) ?? baseLocale);
	}

	if (strategy.type === "custom") {
		throw new Error(
			"Custom strategy is not supported for detectLocaleFromRequest"
		);
	}

	throw new Error(`Unsupported strategy: ${strategy.type}`);
};
