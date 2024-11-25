import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createLspHandler, createLspHandlerMemoryStorage } from "@lix-js/sdk";

const app = new Hono();

const lspHandler = await createLspHandler({
	storage: createLspHandlerMemoryStorage(),
});

// @ts-expect-error - Hono provides a subset of the Request object
app.use("/lsp/*", (c) => lspHandler(c.req));

serve({
	fetch: app.fetch,
	port: 3000,
});

console.log("Listening on http://localhost:3000");
