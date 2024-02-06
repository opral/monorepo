import * as Sentry from "@sentry/node"
import { version } from "../../../package.json"
import { isProduction } from "./env.js"

export function initErrorMonitoring() {
	Sentry.init({
		dsn: "https://paste-sentry-url.here",
		release: version,
		// Not interested in performance data
		tracesSampleRate: 0,
		environment: isProduction ? "production" : "development",
	})
}

export const captureException = Sentry.captureException
