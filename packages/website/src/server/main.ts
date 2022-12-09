/**
 * ------------------------------------
 * This is the main entry point of the server and therefore app.
 *
 * Multiple things come together here:
 *  - express.js that powers the server https://expressjs.com/
 *  - vite-plugin-ssr that powers routing and rendering https://vite-plugin-ssr.com/
 *  - telefunc that powers RPCs https://telefunc.com/
 * ------------------------------------
 */

import express from "express";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import { renderPage } from "vite-plugin-ssr";
import { URL } from "url";

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

	app.use(compression());
	app.use(viteServer.middlewares);
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
