import { extractLocaleFromRequest } from "./extract-locale-from-request.js";
import { deLocalizeUrl } from "./localize-url.js";
import { strategy } from "./variables.js";

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
 * @param {(localizedRequest: Request) => Promise<T> | T} resolve - A function that resolves the request.
 * @returns {Promise<T>} The result of `resolve()` within the async storage context.
 */
export async function serverMiddleware(request, resolve) {
	if (!serverMiddlewareAsyncStorage) {
		const { AsyncLocalStorage } = await import(
			/** not using `node:async_hooks` because webpack can't handle `node:` prefixes */ "async_hooks"
		);
		serverMiddlewareAsyncStorage = new AsyncLocalStorage();
	}
	const locale = extractLocaleFromRequest(request);
	const origin = new URL(request.url).origin;
	const newRequest = strategy.includes("url")
		? new Request(deLocalizeUrl(request.url), request)
		: request;
	return serverMiddlewareAsyncStorage.run({ locale, origin }, () =>
		resolve(newRequest)
	);
}