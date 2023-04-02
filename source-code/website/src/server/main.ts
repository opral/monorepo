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

import express from "express"
import compression from "compression"
import { createServer as createViteServer } from "vite"
import { URL } from "node:url"
import { proxy } from "./git-proxy.js"
import { isProduction, serverSideEnv, validateEnv } from "@env"
import sirv from "sirv"
import * as Sentry from "@sentry/node"
import * as Tracing from "@sentry/tracing"
import cookieSession from "cookie-session"
import { router as vitePluginSsr } from "./vite-plugin-ssr.js"
import { router as telefunc } from "./telefunc.js"
import { router as authService } from "@src/services/auth/index.server.js"
import { router as githubService } from "@src/services/github/index.server.js"
import { router as analyticsService } from "@src/services/analytics/index.server.js"
import { router as inlangSharedServices } from "@inlang/shared/server"

// validate the env variables.
await validateEnv()

const env = await serverSideEnv()

/** the root path of the server (website/) */
const rootPath = new URL("../..", import.meta.url).pathname

const app = express()
// compress responses with gzip
app.use(compression())

app.use(
	cookieSession({
		name: "inlang-session",
		httpOnly: true,
		// secure: isProduction ? true : false,
		// domain: isProduction ? "inlang.com" : undefined,
		sameSite: "strict",
		secret: env.COOKIE_SECRET,
		maxAge: 7 * 24 * 3600 * 1000, // 1 week
	}),
)

// setup sentry error tracking
// must happen before the request handlers
if (isProduction) {
	Sentry.init({
		dsn: env.SENTRY_DSN_SERVER,
		integrations: [
			// enable HTTP calls tracing
			new Sentry.Integrations.Http({ tracing: true }),
			// enable Express.js middleware tracing
			new Tracing.Integrations.Express({ app }),
		],
		tracesSampleRate: 0.1,
	})

	// RequestHandler creates a separate execution context using domains, so that every
	// transaction/span/breadcrumb is attached to its own Hub instance
	app.use(Sentry.Handlers.requestHandler())
	// TracingHandler creates a trace for every incoming request
	app.use(Sentry.Handlers.tracingHandler())
}

console.log({ isProduction })

if (isProduction) {
	// serve build files
	app.use(sirv(`${rootPath}/dist/client`))
} else {
	const viteServer = await createViteServer({
		server: { middlewareMode: true },
		root: rootPath,
		appType: "custom",
	})
	// start vite hot module reload dev server
	// use vite's connect instance as middleware
	app.use(viteServer.middlewares)
}

// ------------------------ START ROUTES ------------------------

// forward git requests to the proxy with wildcard `*`.
app.all(env.VITE_GIT_REQUEST_PROXY_PATH + "*", proxy)

app.use("/services/auth", authService)

app.use(telefunc)

app.use(githubService)

app.use(vitePluginSsr)

app.use(analyticsService)

app.use(inlangSharedServices)

// ------------------------ END ROUTES ------------------------

const port = process.env.PORT ?? 3000
app.listen(port)
console.log(`Server running at http://localhost:${port}/`)

// log to sentry
if (isProduction) {
	// The error handler must be before any other error middleware and after all controllers
	app.use(Sentry.Handlers.errorHandler())
}
