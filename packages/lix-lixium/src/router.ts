import type { Storage } from "./storage/storage.js";
import type { paths } from "@lix-js/server-protocol";

export type LixiumRouter = Hono<HonoEnv>;

type HonoEnv = {
	// extending the context with the storage
	Variables: {
		storage: Storage;
	};
};

export async function createRouter(args: {
	storage: Storage;
}): Promise<LixiumRouter> {
	const router = new Hono<HonoEnv>();

	// abstracting storage given that environments
	// have different storage implementations
	// e.g. S3, in-memory, file system, etc.
	const storageMiddleware = createMiddleware((c, next) => {
		c.set("storage", args.storage);
		return next();
	});

	router.use(storageMiddleware);

	return router;
}

// openApiRouter.post("/lsp/v1/lix/{id}/query", {
//   handler: async (c) => {
//     const id = c.req.param("id");
//     const body =
//       await c.req.json<
//         paths["/lsp/v1/lix/{id}/query"]["post"]["requestBody"]["content"]["application/json"]
//       >();
//   },
// });
