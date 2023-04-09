import { PostHog } from "posthog-node"
import { publicEnv } from "@inlang/env-variables"

export let telemetryNode: PostHog

/**
 * Initialize the telemetry client.
 *
 * This function should be called before using the `telemetry` variable.
 * Use initTelemetryBrowser in a browser context.
 */
export function initTelemetryNode() {
	if (publicEnv.PUBLIC_POSTHOG_TOKEN === undefined) {
		return
	}
	if (telemetryNode === undefined) {
		telemetryNode = new PostHog(publicEnv.PUBLIC_POSTHOG_TOKEN, {
			host: "https://eu.posthog.com",
		})
	}
}
