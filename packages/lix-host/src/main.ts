import { Hono } from "hono";
import { serve } from "@hono/node-server";
import {
	createServerApiHandler,
	createServerApiMemoryStorage,
} from "@lix-js/sdk";

const app = new Hono();

const lsaHandler = await createServerApiHandler({
	storage: createServerApiMemoryStorage(),
});

app.get("/", (c) => c.text("Lix host server"));

// @ts-expect-error - Hono provides a subset of the Request object
app.use("/lsa/*", (c) => lsaHandler(c.req));

serve({
	fetch: app.fetch,
	port: 3000,
});

console.log("Listening on http://localhost:3000");
