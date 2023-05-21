/**
 * ------------------------------------
 * This is the main entry point of the server and therefore router.
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

import express from "express"
import { createServer as createViteServer } from "vite"
import { URL } from "node:url"
import { proxy } from "./git-proxy.js"
import { privateEnv } from "@inlang/env-variables"
import sirv from "sirv"
import cookieSession from "cookie-session"
import { router as vitePluginSsr } from "./vite-plugin-ssr.js"
import { router as telefunc } from "./telefunc.js"
import { router as authService } from "../services/auth/index.server.js"
import { router as githubService } from "../services/github/index.server.js"

/** the root path of the server (website/) */
const rootPath = new URL("../..", import.meta.url).pathname

export const router = express.Router()

router.use(
	cookieSession({
		name: "inlang-session",
		httpOnly: true,
		// secure: isProduction ? true : false,
		// domain: isProduction ? "inlang.com" : undefined,
		sameSite: "strict",
		secret: privateEnv.SESSION_COOKIE_SECRET,
		maxAge: 7 * 24 * 3600 * 1000, // 1 week
	}),
)

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

// forward git requests to the proxy with wildcard `*`.
router.all(privateEnv.PUBLIC_GIT_PROXY_PATH + "*", proxy)

router.use("/services/auth", authService)

router.use(telefunc)

router.use(githubService)

// ! vite plugin ssr must came last
// ! because it uses the wildcard `*` to catch all routes
router.use(vitePluginSsr)
