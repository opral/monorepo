import { route as newRouteV1 } from "./routes/new-v1.js";
import { route as pushRouteV1 } from "./routes/push-v1.js";
import { route as pullRouteV1 } from "./routes/pull-v1.js";
import { route as getRouteV1 } from "./routes/get-v1.js";
import type { LspEnvironment } from "./environment/environment.js";

export type LixServerProtocolHandler = (request: Request) => Promise<Response>;
// Keep old name for backward compatibility
export type LixServerProtocolHandlerContext = {
	request: Request;
	environment: LspEnvironment;
	params?: Record<string, string | undefined>;
};

export type LixServerProtocolHandlerRoute = (
	context: LixServerProtocolHandlerContext
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
 *   const lspHandler = createServerProtocolHandler({ storage });
 *
 *   app.use('/lsp/*', async (req) => {
 *      await lspHandler(req);
 *   });
 *   ```
 *
 * @example
 *   Testing the handler.
 *
 *   ```ts
 *   const lspHandler = createServerProtocolHandler({ storage });
 *   const request = new Request('/lsp/new', {
 *     method: 'POST',
 *     body: new Blob(['...']),
 *   });
 *
 *   const response = await lspHandler(request);
 *
 *   expect(response).to(...);
 *   ```
 */
export async function createServerProtocolHandler(args: {
	environment: LspEnvironment;
}): Promise<LixServerProtocolHandler> {
	const context = { environment: args.environment };

	return async (request) => {
		try {
			const path = new URL(request.url).pathname;
			if (path === "/lsp/get-v1") {
				return await getRouteV1({ ...context, request });
			}
			if (path === "/lsp/new-v1") {
				return await newRouteV1({ ...context, request });
			}
			if (path === "/lsp/push-v1") {
				return await pushRouteV1({ ...context, request });
			}
			if (path === "/lsp/pull-v1") {
				return await pullRouteV1({ ...context, request });
			}

			return new Response(null, { status: 404 });
		} catch (error) {
			console.error(error);
			return new Response(error as string, {
				status: 500,
			});
		}
	};
}
