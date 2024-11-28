import type { Storage } from "./storage/storage.js";
import { route as newRoute } from "./routes/new.js";
import { route as lixQueryRoute } from "./routes/lix/{id}/query.js";
import { route as syncPushRouteV1 } from "./routes/sync/push-v1.js";
import { route as syncPullRouteV1 } from "./routes/sync/pull-v1.js";

export type LixServerApiHandler = (request: Request) => Promise<Response>;

export type LixServerApiHandlerContext = {
	request: Request;
	storage: Storage;
	params?: Record<string, string | undefined>;
};

export type LixServerApiHandlerRoute = (
	context: LixServerApiHandlerContext
) => Promise<Response>;

/**
 * The handler for the lix server protocol.
 *
 * @example
 *   Usage with a server framework.
 *
 *   ```ts
 * 	 // any server framework goes
 *   // here, like express, polka, etc.
 *   // frameworks that do not use
 *   // web standard Request and Response
 *   // objects will need to be mapped.
 *   const app = new Hono();
 *
 *   const lsaHandler = createServerApiHandler({ storage });
 *
 *   app.use('/lsp/*', async (req) => {
 *      await lsaHandler(req);
 *   });
 *   ```
 *
 * @example
 *   Testing the handler.
 *
 *   ```ts
 *   const lsaHandler = createServerApiHandler({ storage });
 *   const request = new Request('/lsp/new', {
 *     method: 'POST',
 *     body: new Blob(['...']),
 *   });
 *
 *   const response = await lsaHandler(request);
 *
 *   expect(response).to(...);
 *   ```
 */
export async function createServerApiHandler(args: {
	storage: Storage;
}): Promise<LixServerApiHandler> {
	const context = { storage: args.storage };

	return async (request) => {
		try {
			const path = new URL(request.url).pathname;
			if (path === "/lsa/new") {
				return newRoute({ ...context, request });
			}
			if (path === "/lsa/sync/push-v1") {
				return syncPushRouteV1({ ...context, request });
			}
			if (path === "/lsa/sync/pull-v1") {
				return syncPullRouteV1({ ...context, request });
			}
			// /lsp/lix/{id}/query
			if (path.match(/\/lsa\/lix\/[^/]+\/query/)) {
				const id = path.split("/")[3]!;
				return lixQueryRoute({
					...context,
					request,
					params: { id },
				});
			}

			return Response.error();
		} catch (error) {
			return new Response(error as string, {
				status: 500,
			});
		}
	};
}
