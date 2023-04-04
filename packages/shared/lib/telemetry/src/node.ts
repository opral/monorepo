import { PostHog } from "posthog-node"

/**
 * The telemetry service for the server-side.
 *
 * The `telemetry` variable wraps posthog in case
 * the implementation should be changed in the future.
 */
if (!process.env.VITE_POSTHOG_TOKEN) {
	throw Error("VITE_POSTHOG_TOKEN is not defined.")
}

export const telemetry = new PostHog(process.env.VITE_POSTHOG_TOKEN, {
	host: "https://eu.posthog.com",
})
