import { extractLocaleFromRequest } from "./extract-locale-from-request.js";

/**
 * Server side async local storage that is set by `serverMiddleware()`.
 *
 * The variable is used to retrieve the locale and origin in a server-side
 * rendering context without effecting other requests.
 *
 * Is `undefined` on the client.
 *
 * @type {import("node:async_hooks").AsyncLocalStorage<{ locale: Locale, origin: string }> | undefined}
 */
let serverMiddlewareAsyncStorage = undefined;

/**
 * The handle function defines the locale for the incoming request.
 *
 * @template T
 * @param {Request} request - The incoming request object.
 * @param {() => Promise<T> | T} resolve - A function that resolves the request.
 * @returns {Promise<T>} The result of `resolve()` within the async storage context.
 */
export async function serverMiddleware(request, resolve) {
	if (!serverMiddlewareAsyncStorage) {
		const { AsyncLocalStorage } = await import("node:async_hooks");
		serverMiddlewareAsyncStorage = new AsyncLocalStorage();
	}
	const locale = extractLocaleFromRequest(request);
	const origin = new URL(request.url).origin;
	return serverMiddlewareAsyncStorage.run({ locale, origin }, () => resolve());
}