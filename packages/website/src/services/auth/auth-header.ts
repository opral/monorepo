/**
 * The key used in the auth header from client to server.
 */
export const AUTH_HEADER_KEY = "x-inlang-authorization";

/**
 * Get the auth header value from client to server.
 */
export function getAuthHeaderValue(args: {
	headers: Record<string, string>;
}): string | undefined {
	return args.headers[AUTH_HEADER_KEY] ?? undefined;
}
