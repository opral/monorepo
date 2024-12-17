import { Hono } from "hono";
import { serve } from "@hono/node-server";
import {
	createServerApiHandler,
	createLsaInMemoryEnvironment,
} from "@lix-js/sdk";

const app = new Hono();

const lixServerApiHandler = await createServerApiHandler({
	environment: createLsaInMemoryEnvironment(),
});

app.get("/", (c) => c.text("Hono!"));

// @ts-expect-error - Hono provides a subset of the Request object
app.use("/lsa/*", (c) => lixServerApiHandler(c.req));

serve({
	fetch: app.fetch,
	port: 3000,
});

console.log("Listening on http://localhost:3000");
