import { handleFetch, type WorkerEnv } from "./src/server/worker";

/**
 * Cloudflare Worker entry point. Delegates request handling to the shared
 * server module so logic can be unit tested with Vitest.
 *
 * @example
 * export default { fetch: (request, env) => handleFetch(request, env) };
 */
export default {
	async fetch(request: Request, env: WorkerEnv): Promise<Response> {
		return handleFetch(request, env);
	},
};
