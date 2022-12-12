/**
 * ------------------------------------
 * This is the main entry point of the server and therefore app.
 *
 * Multiple things come together here:
 *  - express.js that powers the server https://expressjs.com/
 *  - vite-plugin-ssr that powers routing and rendering https://vite-plugin-ssr.com/
 *  - telefunc that powers RPCs https://telefunc.com/
 *
 * !Note: This file has not hot module reload. If you change code, you need to restart the server
 * !      by re-running `npm run dev`.
 * ------------------------------------
 */

import express from "express";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import { renderPage } from "vite-plugin-ssr";
import { URL } from "url";
import { telefunc } from "telefunc";
import http from "node:http";
import { proxy } from "./git-proxy.js";

const isProduction = process.env.NODE_ENV === "production";
/** the root path of the server (website/) */
const rootPath = new URL("../..", import.meta.url).pathname;

async function runServer() {
	const app = express();
	const viteServer = await createViteServer({
		server: { middlewareMode: true },
		root: rootPath,
		appType: "custom",
	});

	// compress responses with gzip
	app.use(compression());
	// use vite's connect instance as middleware
	app.use(viteServer.middlewares);

	// serving telefunc https://telefunc.com/
	app.all(
		"/_telefunc",
		// Parse & make HTTP request body available at `req.body` (required by telefunc)
		app.use(express.text()),
		// handle the request
		async (request, response) => {
			const { body, statusCode, contentType } = await telefunc({
				url: request.originalUrl,
				method: request.method,
				body: request.body,
			});
			return response.status(statusCode).type(contentType).send(body);
		}
	);

	app.all("/git-proxy/*", proxy);

	// serving @src/pages and /public
	app.get("*", async (request, response, next) => {
		const pageContext = await renderPage({
			urlOriginal: request.originalUrl,
		});
		if (pageContext.httpResponse === null) {
			return next();
		}
		const { body, statusCode, contentType } = pageContext.httpResponse;
		return response.status(statusCode).type(contentType).send(body);
	});

	const port = process.env.PORT ?? 3000;
	app.listen(port);
	console.log(`Server running at http://localhost:${port}/`);
}

/**
 * run the server and restart it when an error occurs
 *
 * the server should never go down.
 * ! is broken. port is already in use
 */
function runServerWithRetry() {
	runServer().catch((error) => {
		console.error(error);
		console.log("restarting server in 1 second...");
		setTimeout(runServerWithRetry, 1000);
	});
}

// starting the server
runServerWithRetry();
