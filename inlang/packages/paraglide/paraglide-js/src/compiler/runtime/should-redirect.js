import { localizeUrl } from "./localize-url.js";
import { getLocale } from "./get-locale.js";
import { getUrlOrigin } from "./get-url-origin.js";
import { extractLocaleFromRequestAsync } from "./extract-locale-from-request-async.js";
import { assertIsLocale } from "./assert-is-locale.js";
import { strategy } from "./variables.js";

/**
 * @typedef {object} ShouldRedirectServerInput
 * @property {Request} request
 * @property {string | URL} [url]
 * @property {ReturnType<typeof assertIsLocale>} [locale]
 *
 * @typedef {object} ShouldRedirectClientInput
 * @property {undefined} [request]
 * @property {string | URL} [url]
 * @property {ReturnType<typeof assertIsLocale>} [locale]
 *
 * @typedef {ShouldRedirectServerInput | ShouldRedirectClientInput} ShouldRedirectInput
 *
 * @typedef {object} ShouldRedirectResult
 * @property {boolean} shouldRedirect - Indicates whether the consumer should perform a redirect.
 * @property {ReturnType<typeof assertIsLocale>} locale - Locale resolved using the configured strategies.
 * @property {URL | undefined} redirectUrl - Destination URL when a redirect is required.
 */

/**
 * Determines whether a redirect is required to align the current URL with the active locale.
 *
 * This helper mirrors the logic that powers `paraglideMiddleware`, but works in both server
 * and client environments. It evaluates the configured strategies in order, computes the
 * canonical localized URL, and reports when the current URL does not match.
 *
 * When called in the browser without arguments, the current `window.location.href` is used.
 *
 * @example
 * // Client side usage (e.g. TanStack Router beforeLoad hook)
 * async function beforeLoad({ location }) {
 *   const decision = await shouldRedirect({ url: location.href });
 *
 *   if (decision.shouldRedirect) {
 *     throw redirect({ to: decision.redirectUrl.href });
 *   }
 * }
 *
 * @example
 * // Server side usage with a Request
 * export async function handle(request) {
 *   const decision = await shouldRedirect({ request });
 *
 *   if (decision.shouldRedirect) {
 *     return Response.redirect(decision.redirectUrl, 307);
 *   }
 *
 *   return render(request, decision.locale);
 * }
 *
 * @param {ShouldRedirectInput} [input]
 * @returns {Promise<ShouldRedirectResult>}
 */
export async function shouldRedirect(input = {}) {
	const locale = /** @type {ReturnType<typeof assertIsLocale>} */ (
		await resolveLocale(input)
	);

	if (!strategy.includes("url")) {
		return { shouldRedirect: false, locale, redirectUrl: undefined };
	}

	const currentUrl = resolveUrl(input);
	const localizedUrl = localizeUrl(currentUrl.href, { locale });

	const shouldRedirectToLocalizedUrl =
		normalizeUrl(localizedUrl.href) !== normalizeUrl(currentUrl.href);

	return {
		shouldRedirect: shouldRedirectToLocalizedUrl,
		locale,
		redirectUrl: shouldRedirectToLocalizedUrl ? localizedUrl : undefined,
	};
}

/**
 * Resolves the locale either from the provided input or by using the configured strategies.
 *
 * @param {ShouldRedirectInput} input
 * @returns {Promise<ReturnType<typeof assertIsLocale>>}
 */
async function resolveLocale(input) {
	if (input.locale) {
		return assertIsLocale(input.locale);
	}

	if (input.request) {
		return extractLocaleFromRequestAsync(input.request);
	}

	return getLocale();
}

/**
 * Resolves the current URL from the provided input or runtime context.
 *
 * @param {ShouldRedirectInput} input
 * @returns {URL}
 */
function resolveUrl(input) {
	if (input.request) {
		return new URL(input.request.url);
	}

	if (input.url instanceof URL) {
		return new URL(input.url.href);
	}

	if (typeof input.url === "string") {
		return new URL(input.url, getUrlOrigin());
	}

	if (typeof window !== "undefined" && window?.location?.href) {
		return new URL(window.location.href);
	}

	throw new Error(
		"shouldRedirect() requires either a request, an absolute URL, or must run in a browser environment."
	);
}

/**
 * Normalize url for comparison by stripping the trailing slash.
 *
 * @param {string} url
 * @returns {string}
 */
function normalizeUrl(url) {
	const urlObj = new URL(url);
	urlObj.pathname = urlObj.pathname.replace(/\/$/, "");
	return urlObj.href;
}
