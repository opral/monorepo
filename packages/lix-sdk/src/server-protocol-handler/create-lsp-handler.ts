import type { Storage } from "./storage/storage.js";
import { route as newRoute } from "./routes/new.js";
import { route as lixQueryRoute } from "./routes/lix/{id}/query.js";

export type LspHandler = (request: Request) => Promise<Response>;

export type LspHandlerContext = {
	request: Request;
	storage: Storage;
	params?: Record<string, string | undefined>;
};

export type LspRouteHandler = (context: LspHandlerContext) => Promise<Response>;

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
 *   const lsp = createLspHandler({ storage });
 *
 *   app.use('/lsp/*', async (req) => {
 *      await lsp(req);
 *   });
 *   ```
 *
 * @example
 *   Testing the handler.
 *
 *   ```ts
 *   const lsp = createLspHandler({ storage });
 *   const request = new Request('/lsp/new', {
 *     method: 'POST',
 *     body: new Blob(['...']),
 *   });
 *
 *   const response = await lsp(request);
 *
 *   expect(response).to(...);
 *   ```
 */
export async function createLspHandler(args: {
	storage: Storage;
}): Promise<LspHandler> {
	const context = { storage: args.storage };

	return async (request) => {
		try {
			const path = new URL(request.url).pathname;
			if (path === "/lsp/new") {
				return newRoute({ ...context, request });
			}
			// /lsp/lix/{id}/query
			else if (path.match(/\/lsp\/lix\/[^/]+\/query/)) {
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
