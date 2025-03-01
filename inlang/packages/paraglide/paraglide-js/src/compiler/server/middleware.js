import * as runtime from "./runtime.js";

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
 * @param {(args: { request: Request, locale: import("./runtime.js").Locale }) => T | Promise<T>} resolve - Function to handle the request
 * @param {Object} [options] - Optional configuration for the middleware
 * @param {boolean} [options.disableAsyncLocalStorage=false] - If true, disables AsyncLocalStorage usage.
 *                                                           ⚠️ WARNING: This should ONLY be used in serverless environments
 *                                                           like Cloudflare Workers. Disabling AsyncLocalStorage in traditional
 *                                                           server environments risks cross-request pollution where state from
 *                                                           one request could leak into another concurrent request.
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
 *
 * @example
 * ```typescript
 * // Usage in serverless environments like Cloudflare Workers
 * // ⚠️ WARNING: This should ONLY be used in serverless environments like Cloudflare Workers.
 * // Disabling AsyncLocalStorage in traditional server environments risks cross-request pollution where state from
 * // one request could leak into another concurrent request.
 * export default {
 *   fetch: async (request) => {
 *     return serverMiddleware(
 *       request,
 *       ({ request, locale }) => handleRequest(request, locale),
 *       { disableAsyncLocalStorage: true }
 *     );
 *   }
 * };
 * ```
 */
export async function paraglideMiddleware(request, resolve, options = {}) {
	const { disableAsyncLocalStorage = false } = options;

	if (!runtime.serverAsyncLocalStorage && !disableAsyncLocalStorage) {
		const { AsyncLocalStorage } = await import("async_hooks");
		runtime.overwriteServerAsyncLocalStorage(new AsyncLocalStorage());
	} else if (!runtime.serverAsyncLocalStorage) {
		runtime.overwriteServerAsyncLocalStorage(createMockAsyncLocalStorage());
	}

	const locale = runtime.extractLocaleFromRequest(request);
	const origin = new URL(request.url).origin;

	// if the client makes a request to a URL that doesn't match
	// the localizedUrl, redirect the client to the localized URL
	if (runtime.strategy.includes("url")) {
		const localizedUrl = runtime.localizeUrl(request.url, { locale });
		if (localizedUrl.href !== request.url) {
			return Response.redirect(localizedUrl, 307);
		}
	}

	// If the strategy includes "url", we need to de-localize the URL
	// before passing it to the server middleware.
	//
	// The middleware is responsible for mapping a localized URL to the
	// de-localized URL e.g. `/en/about` to `/about`. Otherwise,
	// the server can't render the correct page.
	const newRequest = runtime.strategy.includes("url")
		? new Request(runtime.deLocalizeUrl(request.url), request)
		: // need to create a new request object because some metaframeworks (nextjs!) throw otherwise
			// https://github.com/opral/inlang-paraglide-js/issues/411
			new Request(request);

	// Otherwise use AsyncLocalStorage to isolate request context
	return runtime.serverAsyncLocalStorage?.run({ locale, origin }, () =>
		resolve({ locale, request: newRequest })
	);
}

/**
 * Creates a mock AsyncLocalStorage implementation for environments where
 * native AsyncLocalStorage is not available or disabled.
 *
 * This mock implementation mimics the behavior of the native AsyncLocalStorage
 * but doesn't require the async_hooks module. It's designed to be used in
 * environments like Cloudflare Workers where AsyncLocalStorage is not available.
 *
 * @returns {import("./runtime.js").ParaglideAsyncLocalStorage}
 */
function createMockAsyncLocalStorage() {
	/** @type {any} */
	let currentStore = undefined;
	return {
		getStore() {
			return currentStore;
		},
		run(store, callback) {
			const previousStore = currentStore;
			currentStore = store;
			try {
				return callback();
			} finally {
				currentStore = previousStore;
			}
		},
	};
}