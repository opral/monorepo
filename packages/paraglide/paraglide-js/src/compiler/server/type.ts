/**
 * The Paraglide runtime API.
 */
export type ServerRuntime = {
	serverMiddleware: typeof import("./server-middleware.js").serverMiddleware;
};
