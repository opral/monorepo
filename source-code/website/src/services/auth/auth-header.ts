/**
 * The key used in the auth header from client to server.
 */
const AUTH_HEADER_KEY = "x-inlang-authorization";

/**
 * Create auth headers from client to server.
 *
 * @example
 *  headers: {
 *      ...createAuthHeader(args),
 *  }
 *
 *  headers: createAuthHeader(args)
 */
export function createAuthHeader(args: { encryptedAccessToken: string }) {
	return {
		[AUTH_HEADER_KEY]: args.encryptedAccessToken,
	};
}

/**
 * Get the auth header value from client to server.
 */
export function getAuthHeaderValue(args: {
	headers: Record<string, string>;
}): string | undefined {
	return args.headers[AUTH_HEADER_KEY] ?? undefined;
}
