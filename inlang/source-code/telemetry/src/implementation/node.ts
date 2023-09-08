import { PostHog } from "posthog-node"
import { publicEnv } from "@inlang/env-variables"

let posthog: PostHog

/**
 * The telemetry service for node environments.
 *
 * Auto initializes if the env variable is set. For browser context,
 * use `telemetryBrowser` instead.
 *
 * For documentation refer to https://posthog.com/docs/libraries/node
 */
export const telemetryNode: PostHog = new Proxy({} as PostHog, {
	get(target, prop) {
		if (posthog) {
			return (posthog as any)[prop]
		} else if (!posthog && publicEnv.PUBLIC_POSTHOG_TOKEN) {
			posthog = new PostHog(publicEnv.PUBLIC_POSTHOG_TOKEN, {
				host: "https://eu.posthog.com",
			})
			return (posthog as any)[prop]
		}
		return () => undefined
	},
})
