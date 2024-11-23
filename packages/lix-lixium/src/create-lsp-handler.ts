import type { Storage } from "./storage/storage.js";
import { route } from "./routes/new.js";

export type LixServerProtocolHandler = (request: Request) => Promise<Response>;

export type LixiumContext = {
	request: Request;
	storage: Storage;
};

export type RouteHandler = (context: LixiumContext) => Promise<Response>;

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
}): Promise<LixServerProtocolHandler> {
	const context = { storage: args.storage };

	return async (request) => {
		const path = new URL(request.url).pathname;
		if (path === "/lsp/new") {
			return route({ ...context, request });
		}
		return Response.error();
	};
}
