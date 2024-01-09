import express from "express"
import { validateEnvVariables, privateEnv } from "@inlang/env-variables"
import * as Sentry from "@sentry/node"
import { router } from "./router.js"
// --------------- SETUP -----------------

export const isProduction = process.env.NODE_ENV === "production"
const { error: errors } = validateEnvVariables({ forProduction: isProduction })

if (errors) {
	throw Error(
		"Production env variables are missing:\n\n" +
			errors.map((e: { key: any; errorMessage: any }) => `${e.key}: ${e.errorMessage}`).join("\n")
	)
}

const app = express()

// setup sentry error tracking
// must happen before the request handlers
if (isProduction) {
	Sentry.init({
		dsn: privateEnv.SERVER_SENTRY_DSN,
		integrations: [
			// enable HTTP calls tracing
			new Sentry.Integrations.Http({ tracing: true }),
		],
		tracesSampleRate: 0.1,
	})

	// RequestHandler creates a separate execution context using domains, so that every
	// transaction/span/breadcrumb is attached to its own Hub instance
	app.use(Sentry.Handlers.requestHandler())
	// TracingHandler creates a trace for every incoming request
	app.use(Sentry.Handlers.tracingHandler())
}

app.use(router)

const port = process.env.PORT ?? 4004
app.listen(port)
console.info(`Server listening at http://localhost:${port}/`)
