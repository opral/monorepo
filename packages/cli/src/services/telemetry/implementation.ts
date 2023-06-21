import { publicEnv } from "@inlang/env-variables"
import { PostHog } from "posthog-node"
import type { TelemetryEvents } from "./events.js"
import { getGitRemotes } from "../../utilities/getGitRemotes.js"
import { parseOrigin } from "@inlang/telemetry"

const gitOrigin = parseOrigin({ remotes: await getGitRemotes() })

const posthog = new PostHog(publicEnv.PUBLIC_POSTHOG_TOKEN!, {
	host: "https://eu.posthog.com",
	// Events are not captured if not immediately flushed.
	//
	// Posthog shouldn't batch events because CLI commands
	// are short-lived, see https://posthog.com/docs/libraries/node.
	flushAt: 1,
	flushInterval: 0,
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
		if (publicEnv.PUBLIC_POSTHOG_TOKEN === undefined) {
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
function capture(args: CaptureEventArguments) {
	if (args.event === "CLI started") {
		posthog.groupIdentify({
			groupType: "repository",
			groupKey: gitOrigin,
			properties: {
				name: gitOrigin,
			},
		})
	}
	return posthog.capture({
		...args,
		distinctId: "unknown",
		groups: {
			repository: gitOrigin!,
		},
	})
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
