import { publicEnv } from "@inlang/env-variables"
import { PostHog } from "posthog-node"
import type { TelemetryEvents } from "./events.js"

// TODO add a project UUID to the tele.groups internal #196

const posthog = new PostHog(publicEnv.PUBLIC_POSTHOG_TOKEN ?? "placeholder", {
	host: "https://eu.posthog.com",
	// Events are not captured if not immediately flushed.
	//
	// Posthog shouldn't batch events because CLI commands
	// are short-lived, see https://posthog.com/docs/libraries/node.
	flushAt: 1,
	flushInterval: 0,
	requestTimeout: 1000,
})

/**
 * Telmetry for the CLI.
 *
 * Auto injects the git origin url.
 */
export const telemetry = new Proxy(posthog, {
	get(target, prop) {
		// If the env variable is set, use the PostHog SDK. Otherwise, use a proxy that
		// returns a no-op function.

		if (!publicEnv.PUBLIC_POSTHOG_TOKEN) {
			return () => undefined
		}
		// Auto inject the git origin url and user id.
		else if (prop === "capture") {
			return capture
		}
		return (target as any)[prop]
	},
}) as unknown as Omit<PostHog, "capture"> & { capture: typeof capture }

/**
 * Wrapper to auto inject the git origin url and user id.
 */
function capture(args: CaptureEventArguments, projectId?: string) {
	if (!publicEnv.PUBLIC_POSTHOG_TOKEN) {
		return
	}

	const data: Parameters<PostHog["capture"]>[0] = {
		...args,
		distinctId: "unknown",
	}

	if (projectId) {
		data.groups = {
			project: projectId,
		}
	}

	return posthog.capture(data)
}

/**
 * Typesafe wrapper around the `telemetryNode.capture` method.
 *
 * Exists to avoid typos/always set the correct event name and properties.
 */
type CaptureEventArguments =
	| Omit<Parameters<PostHog["capture"]>[0], "distinctId" | "groups"> & {
			event: TelemetryEvents
	  }
