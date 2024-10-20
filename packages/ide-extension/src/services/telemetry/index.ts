import type { TelemetryEvents } from "./events.js"
import { getUserId } from "../../utilities/settings/getUserId.js"
import { PostHog } from "posthog-node"
import { ENV_VARIABLES } from "../env-variables/index.js"
import { state } from "../../utilities/state.js"

const posthog = ENV_VARIABLES.PUBLIC_POSTHOG_TOKEN
	? new PostHog(ENV_VARIABLES.PUBLIC_POSTHOG_TOKEN, {
			host: "https://eu.posthog.com",
		})
	: // allow contributors to develop and run the app without
		// setting up the telemetry service
		new Proxy({} as PostHog, {
			get() {
				return () => undefined
			},
		})

/**
 * @deprecated use `capture()` directly
 */
// @ts-expect-error - capture omits the event type distinct it
export const telemetry: Omit<typeof posthog, "capture"> & {
	capture: typeof capture
} = new Proxy(posthog, {
	get(target, prop) {
		if (prop === "capture") {
			return capture
		}
		// @ts-expect-error - the posthog instance is a proxy
		return target[prop]
	},
})
/**
 * Typesafe wrapper around the `telemetryNode.capture` method.
 *
 * Exists to avoid typos/always set the correct event name and properties.
 */
type CaptureEventArguments = Omit<
	Parameters<typeof posthog.capture>[0],
	"distinctId" | "groups"
> & {
	event: TelemetryEvents
}

/**
 * Capture a telemetry event in a typesafe way.
 */
export async function capture(args: CaptureEventArguments) {
	const userID = await getUserId()
	const projectId = (await state().project?.id.get()) as undefined | string

	// enable contributors to develop and run the app without
	// setting up the telemetry service
	if (ENV_VARIABLES.PUBLIC_POSTHOG_TOKEN === undefined) {
		return
	}

	return posthog.capture({
		...args,
		// automatically add the project if one exists
		groups: projectId
			? {
					project: projectId,
				}
			: undefined,
		distinctId: userID,
	})
}
