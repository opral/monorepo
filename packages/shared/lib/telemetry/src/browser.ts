import { posthog } from "posthog-js"
import { publicEnv } from "@inlang/env-variables"
import { ROUTE_PATH } from "./shared.js"

/**
 * The telemetry service.
 *
 * The `telemetry` variable wraps posthog in case
 * the implementaiton should be changed in the future.
 */
export const telemetryBrowser = posthog

/**
 * Initialize the telemetry client.
 *
 * This function should be called before using the `telemetry` variable.
 * Use initTelemetryNode in a node context.
 */
export function initTelemetryBrowser() {
	if (publicEnv.PUBLIC_POSTHOG_TOKEN === undefined) {
		throw Error("Missing env variable PUBLIC_POSTHOG_TOKEN")
	} else if (window === undefined) {
		console.warn(
			"You are likely trying to use this in a Node.js environment. Use @inlang/shared/telemetry/node instead.",
		)
	}

	const enabled = window !== undefined && posthog.has_opted_out_capturing() === false

	if (enabled) {
		posthog.init(publicEnv.PUBLIC_POSTHOG_TOKEN, {
			api_host: ROUTE_PATH,
			autocapture: false,
		})
	}
}
