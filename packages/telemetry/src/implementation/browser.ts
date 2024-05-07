import { posthog } from "posthog-js"
import { publicEnv } from "@inlang/env-variables"

/**
 * The telemetry service.
 *
 * The `telemetry` variable wraps posthog in case
 * the implementaiton should be changed in the future.
 */
export const telemetryBrowser = new Proxy(posthog, {
	get(target, prop) {
		if (prop === "init") {
			return initWrapper
		} else if (publicEnv.PUBLIC_POSTHOG_TOKEN === undefined) {
			return () => undefined
		}
		return (target as any)[prop]
	},
}) as unknown as Omit<typeof posthog, "init"> & { init: typeof initWrapper }

function initWrapper(
	config?: Parameters<typeof posthog.init>[1],
	name?: Parameters<typeof posthog.init>[2]
): ReturnType<typeof posthog.init> {
	if (window === undefined) {
		return console.warn(
			"You are likely trying to use this in a Node.js environment. Use telemetryNode instead."
		)
	} else if (config?.api_host) {
		return console.warn("The api_host is set by the telemetry module.")
	} else if (publicEnv.PUBLIC_POSTHOG_TOKEN === undefined) {
		return console.warn("Posthog token is not set. Telemetry will not be initialized.")
	}
	return posthog.init(
		publicEnv.PUBLIC_POSTHOG_TOKEN,
		{
			api_host:
				process.env.NODE_ENV === "production" ? "https://tm.inlang.com" : "http://localhost:4005",
			capture_performance: false,
			...config,
			autocapture: {
				capture_copied_text: true,
			},
		},
		name
	)
}
