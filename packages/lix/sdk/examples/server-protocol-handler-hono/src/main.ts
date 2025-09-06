import { Hono } from "hono";
import { serve } from "@hono/node-server";
import {
	createServerProtocolHandler,
	createLspInMemoryEnvironment,
} from "@lix-js/sdk";

const app = new Hono();

const lixServerProtocolHandler = await createServerProtocolHandler({
	environment: createLspInMemoryEnvironment(),
});

app.get("/", (c) => c.text("Hono!"));

// @ts-expect-error - Hono provides a subset of the Request object
app.use("/lsp/*", (c) => lixServerProtocolHandler(c.req));

serve({
	fetch: app.fetch,
	port: 3000,
});

console.log("Listening on http://localhost:3000");
