import { publicEnv } from "@inlang/env-variables"
import { PostHog } from "posthog-node"

/**
 * The telemetry service for the CLI.
 */
export const telemetry = publicEnv.PUBLIC_POSTHOG_TOKEN
	? new PostHog(publicEnv.PUBLIC_POSTHOG_TOKEN, {
			host: "https://eu.posthog.com",
			// Events are not captured if not immediately flushed.
			//
			// Posthog shouldn't batch events because CLI commands
			// are short-lived, see https://posthog.com/docs/libraries/node.
			flushAt: 1,
			flushInterval: 0,
	  })
	: // If the env variable is set, use the PostHog SDK. Otherwise, use a proxy that
	  // returns a no-op function.
	  new Proxy({} as PostHog, {
			get() {
				return () => undefined
			},
	  })
