/**
 * ------------------------------------
 * This is the main entry point of the server and therefore router.
 *
 * Multiple things come together here:
 *  - express.js that powers the server https://expressjs.com/
 *  - vike that powers routing and rendering https://vike.dev/
 *
 * !Note: This file has not hot module reload. If you change code, you need to restart the server
 * !      by re-running `npm run dev`.
 * ------------------------------------
 */

import express, {
	Router,
	type NextFunction,
	type Request,
	type Response,
} from "express";
import { createServer as createViteServer } from "vite";
import { URL } from "node:url";
import sirv from "sirv";
import { renderPage } from "vike/server";

/** the root path of the server (website/) */
const rootPath = new URL("../..", import.meta.url).pathname;

/**
 * This middelware aims to redirect old Urls to new ones.
 * You can use it by adding the old and the new url in the
 * Object as key and value.
 */
const redirectMap: { [key: string]: string } = {};

export const router: Router = express.Router();

if (process.env.NODE_ENV === "production") {
	// import server code https://github.com/brillout/vite-plugin-ssr/issues/403
	await import(`${rootPath}/dist/server/entry.mjs`);
	router.use(sirv(`${rootPath}/dist/client`));
} else {
	const viteServer = await createViteServer({
		server: { middlewareMode: true },
		root: rootPath,
		appType: "custom",
	});
	// start vite hot module reload dev server
	// use vite's connect instance as middleware
	router.use(viteServer.middlewares);
}

// ------------------------ START ROUTES ------------------------

router.use((request: Request, response: Response, next: NextFunction) => {
	try {
		//redirect
		if (Object.keys(redirectMap).includes(request.url)) {
			const redirectUrl: string = redirectMap[request.url]
				? redirectMap[request.url]!
				: request.url!;
			response.redirect(redirectUrl);
		}
		next();
	} catch (error) {
		next(error);
	}
});

router.get("/documentation", (request, response) => {
	return response.redirect(301, "https://github.com/opral/inlang-sdk");
});

router.get("/documentation/*", (request, response) => {
	return response.redirect(301, "https://github.com/opral/inlang-sdk");
});

router.get("/g/*", (request, response) => {
	return response.redirect(301, "/");
});

router.get("/c/guides", (request, response) => {
	return response.redirect(301, "/");
});

router.get("/c/astro", (request, response) => {
	return response.redirect(
		301,
		"https://inlang.com/m/gerre34r/library-inlang-paraglideJs/astro"
	);
});

router.get("/c/svelte", (request, response) => {
	return response.redirect(
		301,
		"https://inlang.com/m/gerre34r/library-inlang-paraglideJs/sveltekit"
	);
});

router.get("/c/lint-rules", (request, response) => {
	return response.redirect(301, "https://github.com/opral/lix-sdk/issues/239");
});

router.get("m/osslbuzt*", (request, response) => {
	return response.redirect(
		301,
		"https://inlang.com/m/gerre34r/library-inlang-paraglideJs/next-js"
	);
});

router.get("/c/(next|nextjs)", (request, response) => {
	return response.redirect(
		301,
		"https://inlang.com/m/gerre34r/library-inlang-paraglideJs/next-js"
	);
});

// serving #src/pages and /public
//! it is extremely important that a request handler is not async to catch errors
//! express does not catch async errors. hence, renderPage uses the callback pattern
router.get("*", (request, response, next) => {
	renderPage({
		urlOriginal: request.originalUrl,
	})
		.then((pageContext) => {
			if (pageContext.httpResponse === null) {
				next();
			} else {
				const { body, headers, statusCode } = pageContext.httpResponse;
				for (const [name, value] of headers) response.setHeader(name, value);
				response.status(statusCode).send(body);
			}
		})
		// pass the error to expresses error handling
		.catch(next);
});
