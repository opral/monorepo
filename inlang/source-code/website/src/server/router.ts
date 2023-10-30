/**
 * ------------------------------------
 * This is the main entry point of the server and therefore router.
 *
 * Multiple things come together here:
 *  - express.js that powers the server https://expressjs.com/
 *  - vite-plugin-ssr that powers routing and rendering https://vite-plugin-ssr.com/
 *
 * !Note: This file has not hot module reload. If you change code, you need to restart the server
 * !      by re-running `npm run dev`.
 * ------------------------------------
 */

import express, { Router } from "express"
import { createServer as createViteServer } from "vite"
import { URL } from "node:url"
import sirv from "sirv"
import { router as vitePluginSsr } from "./vite-plugin-ssr.js"
import { redirects } from "./redirects.js"

/** the root path of the server (website/) */
const rootPath = new URL("../..", import.meta.url).pathname

export const router: Router = express.Router()

if (process.env.NODE_ENV === "production") {
	// import server code https://github.com/brillout/vite-plugin-ssr/issues/403
	await import(`${rootPath}/dist/server/importBuild.cjs`)
	router.use(sirv(`${rootPath}/dist/client`))
} else {
	const viteServer = await createViteServer({
		server: { middlewareMode: true },
		root: rootPath,
		appType: "custom",
	})
	// start vite hot module reload dev server
	// use vite's connect instance as middleware
	router.use(viteServer.middlewares)
}

// ------------------------ START ROUTES ------------------------

router.use(redirects)

// ! vite plugin ssr must came last
// ! because it uses the wildcard `*` to catch all routes
router.use(vitePluginSsr)
