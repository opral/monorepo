import { extractLocaleFromRequest } from "./extract-locale-from-request.js";
import { deLocalizeUrl, localizeUrl } from "./localize-url.js";
import { strategy, TREE_SHAKE_URL_STRATEGY_USED } from "./variables.js";

/**
 * Server side async local storage that is set by `serverMiddleware()`.
 *
 * The variable is used to retrieve the locale and origin in a server-side
 * rendering context without effecting other requests.
 *
 * Is `undefined` on the client.
 *
 * @type {import("async_hooks").AsyncLocalStorage<{ locale: Locale, origin: string }> | undefined}
 */
let serverMiddlewareAsyncStorage = undefined;

/**
 * Server middleware that handles locale-based routing and request processing.
 *
 * This middleware performs several key functions:
 *
 * 1. Determines the locale for the incoming request using configured strategies
 * 2. Handles URL localization and redirects
 * 3. Maintains locale state using AsyncLocalStorage to prevent request interference
 *
 * When URL strategy is used:
 *
 * - If URL doesn't match the determined locale, redirects to localized URL
 * - De-localizes URLs before passing to server (e.g., `/fr/about` → `/about`)
 *
 * @template T - The return type of the resolve function
 *
 * @param {Request} request - The incoming request object
 * @param {(args: { request: Request, locale: Locale }) => T | Promise<T>} resolve - Function to handle the request
 *
 * @returns {Promise<Response | any>} Returns either:
 * - A `Response` object (302 redirect) if URL localization is needed
 * - The result of the resolve function if no redirect is required
 *
 * @example
 * ```typescript
 * // Basic usage in metaframeworks like NextJS, SvelteKit, Astro, Nuxt, etc.
 * export const handle = async ({ event, resolve }) => {
 *   return serverMiddleware(event.request, ({ request, locale }) => {
 *     // let the framework further resolve the request
 *     return resolve(request);
 *   });
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Usage in a framework like Express JS or Hono
 * app.use(async (req, res, next) => {
 *   const result = await serverMiddleware(req, ({ request, locale }) => {
 *     // If a redirect happens this won't be called
 *     return next(request);
 *   });
 * });
 * ```
 */
export async function serverMiddleware(request, resolve) {
	if (!serverMiddlewareAsyncStorage) {
		const { AsyncLocalStorage } = await import("async_hooks");
		serverMiddlewareAsyncStorage = new AsyncLocalStorage();
	}

	const locale = extractLocaleFromRequest(request);
	const origin = new URL(request.url).origin;

	if (TREE_SHAKE_URL_STRATEGY_USED) {
		// if the client makes a request to a URL that doesn't match
		// the localizedUrl, redirect the client to the localized URL
		const localizedUrl = localizeUrl(request.url, { locale });
		if (localizedUrl.href !== request.url) {
			return Response.redirect(localizedUrl, 302);
		}
	}

	// If the strategy includes "url", we need to de-localize the URL
	// before passing it to the server middleware.
	//
	// The middleware is responsible for mapping a localized URL to the
	// de-localized URL e.g. `/en/about` to `/about`. Otherwise,
	// the server can't render the correct page.
	const newRequest = strategy.includes("url")
		? new Request(deLocalizeUrl(request.url), request)
		: request;

	return serverMiddlewareAsyncStorage.run({ locale, origin }, () =>
		resolve({ locale, request: newRequest })
	);
}
