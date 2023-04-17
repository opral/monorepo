import express from "express"
import compression from "compression"
import { validateEnvVariables, privateEnv } from "@inlang/env-variables"
import * as Sentry from "@sentry/node"
import * as Tracing from "@sentry/tracing"
import { isProduction } from "./utilities.js"
import { router as websiteRouter } from "@inlang/website/router"
import { router as telemetryRouter } from "@inlang/telemetry/router"
import { router as rpcRouter } from "@inlang/rpc/router"

// --------------- SETUP -----------------

const [, errors] = validateEnvVariables({ forProduction: isProduction })
if (errors) {
	throw Error(
		"Invalid environment variables:\n\n" +
			errors.map((e) => `${e.key}: ${e.errorMessage}`).join("\n"),
	)
}

const app = express()
// compress responses with gzip
app.use(compression())

// setup sentry error tracking
// must happen before the request handlers
if (isProduction) {
	Sentry.init({
		dsn: privateEnv.SERVER_SENTRY_DSN,
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

// ----------------- ROUTES ----------------------

app.use(telemetryRouter)

app.use(rpcRouter)

// ! website comes last in the routes because it uses the wildcard `*` to catch all routes
app.use(websiteRouter)

// ----------------- START SERVER -----------------

const port = process.env.PORT ?? 3000
app.listen(port)
console.log(`Server running at http://localhost:${port}/`)

// log to sentry
if (isProduction) {
	// The error handler must be before any other error middleware and after all controllers
	app.use(Sentry.Handlers.errorHandler())
}
