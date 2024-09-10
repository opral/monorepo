import express from "express"
import compression from "compression"
import * as Sentry from "@sentry/node"
import * as Tracing from "@sentry/tracing"
import { router } from "./router.js"
import { posthog } from "posthog-js"
import { privateEnv } from "#src/services/env-variables/index.js"
// --------------- SETUP -----------------

export const isProduction = process.env.NODE_ENV === "production"

const app = express()
// compress responses with gzip
app.use(compression())

// setup sentry error tracking
// must happen before the request handlers
if (isProduction) {
	Sentry.init({
		dsn: privateEnv.SERVER_SENTRY_DSN,
		integrations: [
			// enable posthog integration
			new posthog.SentryIntegration(posthog, "opral", 4506599134461952),
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

app.set("base", "/")
app.use("/", router)

const port = 4003
app.listen(port, () => console.info(`Server listening at http://localhost:${port}`))
