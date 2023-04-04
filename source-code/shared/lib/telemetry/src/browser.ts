import { posthog } from "posthog-js"
import { isServer } from "solid-js/web"
import { ROUTE_PATH } from "./shared.js"

/**
 * The service is enabled if the following flags are true
 */
const enabled = isServer === false && posthog.has_opted_out_capturing() === false

// automatically initialize posthog when this file is imported
if (enabled) {
	// @ts-expect-error - Process can't be used.
	if (import.meta.env.VITE_POSTHOG_TOKEN === undefined) {
		throw Error("Missing env variable VITE_POSTHOG_TOKEN")
	}
	// @ts-expect-error - Process can't be used.
	posthog.init(import.meta.env.VITE_POSTHOG_TOKEN, {
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
