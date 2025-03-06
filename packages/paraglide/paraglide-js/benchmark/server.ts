import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { serve } from "@hono/node-server";
import path from "node:path";
import fs from "node:fs";
import { runBuilds } from "./build.ts";

export function startServer(port: number) {
	const app = new Hono();

	// Serve multiple builds under different paths
	const distPath = path.resolve("dist");
	const directories = fs.readdirSync(distPath);

	for (const dir of directories) {
		app.use(`/${dir}*`, serveStatic({ root: "./dist" }));
	}

	app.get("/", (c) =>
		c.html(`
	<h1>Paraglide JS Benchmark</h1>
	<h2>Available Builds:</h2>
	${directories.map((dir) => `<a href="${dir}">${dir}</a>`).join("<br>")}
`)
	);

	app.use("*", async (c) => {
		return c.html(
			`<p>404 Not Found. You likely requested an spa build from an ssr route.</p><p><a href="/">Go back to the homepage</a></p>`,
			404
		);
	});

	const server = serve({
		fetch: app.fetch,
		port,
	});
	console.log(`Server is running at http://localhost:${port}`);
	return server;
}

if (process.env.PREVIEW) {
	await runBuilds();
	startServer(3005);
}
