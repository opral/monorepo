import { customServerStrategies, isCustomStrategy } from "./strategy.js";
import { strategy } from "./variables.js";
import { assertIsLocale } from "./assert-is-locale.js";
import { isLocale } from "./is-locale.js";
import { extractLocaleFromRequest } from "./extract-locale-from-request.js";

/**
 * Wrapper async function for `extractLocaleFromRequest`
 *
 * @see {@link https://github.com/opral/inlang-paraglide-js/issues/527#issuecomment-2978151022}
 *
 * Plan to deprecate this at the next major release and make `extractLocaleFromRequest` async.
 *
 * @private
 *
 * @example
 *   const locale = await extractLocaleFromRequestAsync(request);
 *
 * @type {(request: Request) => Promise<Locale>}
 */
export const extractLocaleFromRequestAsync = async (request) => {
	/** @type {string|undefined} */
	let locale;
	for (const strat of strategy) {
		if (isCustomStrategy(strat) && customServerStrategies.has(strat)) {
			const handler = customServerStrategies.get(strat);
			/** @type {string|undefined} */
			locale = await handler.getLocale(request);
		}
	}
	if (locale === undefined) {
		locale = extractLocaleFromRequest(request);
	}
	if (locale !== undefined) {
		if (!isLocale(locale)) {
			locale = undefined;
		} else {
			return assertIsLocale(locale);
		}
	}
	return locale;
};
