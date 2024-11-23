import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createLspHandler, createLspHandlerMemoryStorage } from "@lix-js/sdk";

const app = new Hono();

const lsp = await createLspHandler({
	storage: createLspHandlerMemoryStorage(),
});

app.get("/", (c) => c.text("Hono!"));

app.use("/lsp/*", async (c) => {
	// @ts-ignore
	return await lsp(c.req);
});

serve({
	fetch: app.fetch,
	port: 3000,
});

console.log("Listening on http://localhost:3000");
