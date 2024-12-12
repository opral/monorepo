import { Hono } from "hono";
import { serve } from "@hono/node-server";
import {
	createServerApiHandler,
	createLsaInMemoryEnvironment,
} from "@lix-js/sdk";
import { cors } from "hono/cors";

const app = new Hono();

const lsaHandler = await createServerApiHandler({
	environment: createLsaInMemoryEnvironment(),
});

app.get("/", (c) => c.text("Lix host server"));

app.use("/lsa/*", cors());
// @ts-expect-error - Hono provides a subset of the Request object
app.use("/lsa/*", (c) => lsaHandler(c.req));

serve({
	fetch: app.fetch,
	port: 3000,
});

console.log("Listening on http://localhost:3000");
