/**
 * The Paraglide runtime API.
 */
export type ServerRuntime = {
	paraglideMiddleware: typeof import("./middleware.js").paraglideMiddleware;
};
