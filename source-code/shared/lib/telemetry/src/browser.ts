import { publicEnv } from "../../../env.js"
import { posthog } from "posthog-js"
import { isServer } from "solid-js/web"
import { ROUTE_PATH } from "./shared.js"

/**
 * The service is enabled if the following flags are true
 */
const enabled = isServer === false && posthog.has_opted_out_capturing() === false

// automatically initialize posthog when this file is imported
if (enabled) {
	if (publicEnv.PUBLIC_POSTHOG_TOKEN === undefined) {
		throw Error("Missing env variable PUBLIC_POSTHOG_TOKEN")
	}
	posthog.init(publicEnv.PUBLIC_POSTHOG_TOKEN, {
		api_host: ROUTE_PATH,
		autocapture: false,
	})
}

/**
 * The telemetry service.
 *
 * The `telemetry` variable wraps posthog in case
 * the implementaiton should be changed in the future.
 */
export const telemetry = posthog
