import * as Sentry from "@sentry/node"
import { version } from "../../../package.json"
import { ENV_VARIABLES } from "../env-variables/index.js"

export function initErrorMonitoring() {
	Sentry.init({
		dsn: "https://ba058608bbf997cfe6c5f8d093d31d5b@us.sentry.io/4506700407177216",
		release: version,
		// Not interested in performance data
		tracesSampleRate: 0,
		environment: ENV_VARIABLES.IS_PRODUCTION ? "production" : "development",
	})
}

export const captureException = Sentry.captureException
