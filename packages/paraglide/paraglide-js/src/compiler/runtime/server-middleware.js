import { extractLocaleFromRequest } from "./extract-locale-from-request.js";
import { serverAsyncStorage } from "./variables.js";

/**
 * The handle function defines the locale for the incoming request.
 *
 * @type {(request: Request, resolve: () => void) => Promise<void>}
 *
 */
export async function serverMiddleware(request, resolve) {
	const locale = extractLocaleFromRequest(request);
	const origin = new URL(request.url).origin;
	return serverAsyncStorage?.run({ locale, origin }, () => resolve());
}
