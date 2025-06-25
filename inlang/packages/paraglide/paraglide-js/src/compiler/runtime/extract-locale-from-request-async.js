import { customServerStrategies, isCustomStrategy } from "./strategy.js";
import { strategy } from "./variables.js";
import { assertIsLocale } from "./assert-is-locale.js";
import { isLocale } from "./is-locale.js";
import { extractLocaleFromRequest } from "./extract-locale-from-request.js";

/**
 * Asynchronously extracts a locale from a request.
 *
 * This function supports async custom server strategies, unlike the synchronous
 * `extractLocaleFromRequest`. Use this function when you have custom server strategies
 * that need to perform asynchronous operations (like database calls) in their getLocale method.
 *
 * The function first processes any custom server strategies asynchronously, then falls back
 * to the synchronous `extractLocaleFromRequest` for all other strategies.
 *
 * @see {@link https://github.com/opral/inlang-paraglide-js/issues/527#issuecomment-2978151022}
 *
 * @example
 *   // Basic usage
 *   const locale = await extractLocaleFromRequestAsync(request);
 *
 * @example
 *   // With custom async server strategy
 *   defineCustomServerStrategy("custom-database", {
 *     getLocale: async (request) => {
 *       const userId = extractUserIdFromRequest(request);
 *       return await getUserLocaleFromDatabase(userId);
 *     }
 *   });
 *
 *   const locale = await extractLocaleFromRequestAsync(request);
 *
 * @type {(request: Request) => Promise<Locale>}
 */
export const extractLocaleFromRequestAsync = async (request) => {
	/** @type {string|undefined} */
	let locale;

	// Process custom strategies first, in order
	for (const strat of strategy) {
		if (isCustomStrategy(strat) && customServerStrategies.has(strat)) {
			const handler = customServerStrategies.get(strat);
			/** @type {string|undefined} */
			locale = await handler.getLocale(request);

			// If we got a valid locale from this custom strategy, use it
			if (locale !== undefined && isLocale(locale)) {
				return assertIsLocale(locale);
			}
		}
	}

	// If no custom strategy provided a valid locale, fall back to sync version
	locale = extractLocaleFromRequest(request);
	return assertIsLocale(locale);
};
