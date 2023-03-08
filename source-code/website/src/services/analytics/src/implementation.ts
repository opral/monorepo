import { clientSideEnv, isProduction } from "@env"
import { posthog } from "posthog-js"
import { isServer } from "solid-js/web"

/**
 * The path to which API calls are made.
 */
export const ROUTE_PATH = "/services/_ph"

/**
 * The service is enabled if the following flags are true
 */
const enabled = isProduction && isServer === false && posthog.has_opted_out_capturing() === false

// automatically initialize posthog when this file is imported
if (enabled) {
	if (clientSideEnv.VITE_POSTHOG_TOKEN === undefined) {
		throw Error("Missing env variable VITE_POSTHOG_TOKEN")
	}
	posthog.init(clientSideEnv.VITE_POSTHOG_TOKEN, {
		api_host: ROUTE_PATH,
	})
}

/**
 * The analytics service.
 *
 * The `analytics` variable wraps posthog in case
 * the implementaiton should be changed in the future.
 */
export const analytics = posthog
