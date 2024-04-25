import express, { Router } from "express"
import compression from "compression"
import * as Sentry from "@sentry/node"
import * as Tracing from "@sentry/tracing"
import cookieSession from "cookie-session"

import { router as authService } from "./auth/router.js"

import { proxy as gitProxy } from "./git-proxy.js"
import { router as githubProxy } from "./github-proxy.js"
import { getEnvVar } from "./util/getEnv.js"

const isProduction = process.env.NODE_ENV === "production"
const SERVER_SENTRY_DSN = getEnvVar("SERVER_SENTRY_DSN", {
	descirption: "DSN for Sentry (on the server)",
	default: !isProduction ? "" : undefined,
})
const SESSION_COOKIE_SECRET = getEnvVar("SESSION_COOKIE_SECRET")

const app = express()
app.use(compression())

// setup sentry error tracking
// must happen before the request handlers
if (isProduction) {
	Sentry.init({
		dsn: SERVER_SENTRY_DSN,
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

// --- Setup router ---
const router: Router = express.Router()

router.use(
	cookieSession({
		name: "inlang-session",
		httpOnly: true,
		// secure: isProduction ? true : false,
		// domain: isProduction ? "inlang.com" : undefined,
		sameSite: "strict",
		secret: SESSION_COOKIE_SECRET,
		maxAge: 7 * 24 * 3600 * 1000, // 1 week
	})
)

router.use("/services/auth", authService)
router.use(githubProxy)
router.all("/git-proxy/" + "*", gitProxy)

app.use(router)

// --- Start server ---
const port = process.env.PORT ?? 3001
app.listen(port)
console.info(`Server running at http://localhost:${port}/`)

// log to sentry
if (isProduction) {
	// The error handler must be before any other error middleware and after all controllers
	app.use(Sentry.Handlers.errorHandler())
}
