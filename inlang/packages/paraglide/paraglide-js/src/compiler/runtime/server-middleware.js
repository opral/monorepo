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
 * The handle function defines the locale for the incoming request.
 *
 * @template T
 * @param {Request} request - The incoming request object.
 * @param {(args: { request: Request, locale: Locale }) => T | Promise<T>} resolve - A function that resolves the request.
 * @returns {Promise<any>} The result of `resolve()` within the async storage context.
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
