import express from "express";
import compression from "compression";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
// @ts-expect-error - needs .ts extension here because of https://github.com/nodejs/loaders/issues/214
// using the new --rewriteImportPaths flag seemed to experimental.
import { router } from "./router.ts";
// --------------- SETUP -----------------

export const isProduction = process.env.NODE_ENV === "production";

const app = express();
// compress responses with gzip
app.use(compression());

// setup sentry error tracking
// must happen before the request handlers
if (isProduction) {
	Sentry.init({
		dsn: process.env.SERVER_SENTRY_DSN,
		integrations: [
			// enable HTTP calls tracing
			new Sentry.Integrations.Http({ tracing: true }),
			// enable Express.js middleware tracing
			new Tracing.Integrations.Express({ app }),
		],
		tracesSampleRate: 0.1,
	});

	// RequestHandler creates a separate execution context using domains, so that every
	// transaction/span/breadcrumb is attached to its own Hub instance
	app.use(Sentry.Handlers.requestHandler());
	// TracingHandler creates a trace for every incoming request
	app.use(Sentry.Handlers.tracingHandler());
}

app.set("base", "/");
app.use("/", router);

const port = 4001;
app.listen(port, () =>
	console.info(`Server listening at http://localhost:${port}`)
);
