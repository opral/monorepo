import { Hono } from "hono";
import { serve } from "@hono/node-server";
import {
	createServerProtocolHandler,
	createLspInMemoryEnvironment,
} from "@lix-js/sdk";
import { cors } from "hono/cors";

const app = new Hono();

const lspHandler = await createServerProtocolHandler({
	environment: createLspInMemoryEnvironment(),
});

app.get("/", (c) => c.text("Lix host server"));

app.use("/lsp/*", cors());
// @ts-expect-error - Hono provides a subset of the Request object
app.use("/lsp/*", (c) => lspHandler(c.req));

serve({
	fetch: app.fetch,
	port: 3000,
});

console.log("Listening on http://localhost:3000");
