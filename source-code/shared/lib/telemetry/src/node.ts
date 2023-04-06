import { publicEnv } from "../../../env.js"
import { PostHog } from "posthog-node"

/**
 * The telemetry service for the server-side.
 *
 * The `telemetry` variable wraps posthog in case
 * the implementation should be changed in the future.
 */
if (publicEnv.PUBLIC_POSTHOG_TOKEN === undefined) {
	throw Error("PUBLIC_POSTHOG_TOKEN is not defined.")
}

export const telemetry = new PostHog(publicEnv.PUBLIC_POSTHOG_TOKEN, {
	host: "https://eu.posthog.com",
})
