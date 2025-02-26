/**
 * The Paraglide runtime API.
 */
export type ServerRuntime = {
	middleware: typeof import("./middleware.js").middleware;
};
