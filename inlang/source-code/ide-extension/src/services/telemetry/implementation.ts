import { telemetryNode } from "@inlang/telemetry"
import type { TelemetryEvents } from "./events.js"
import { getUserId } from "../../utilities/settings/getUserId.js"

export const telemetry: Omit<typeof telemetryNode, "capture"> & { capture: typeof capture } =
	new Proxy(telemetryNode, {
		get(target, prop) {
			if (prop === "capture") {
				return capture
			}
			return (target as any)[prop]
		},
	}) as any

/**
 * Typesafe wrapper around the `telemetryNode.capture` method.
 *
 * Exists to avoid typos/always set the correct event name and properties.
 */
type CaptureEventArguments =
	| Omit<Parameters<typeof telemetryNode.capture>[0], "distinctId" | "groups"> & {
			event: TelemetryEvents
	  }

// let gitOrigin: string | undefined
let userID: string

/**
 * Capture a telemetry event in a typesafe way.
 */
async function capture(args: CaptureEventArguments) {
	if (userID === undefined) {
		userID = await getUserId()
	}
	return telemetryNode.capture({
		...args,
		distinctId: userID,
	})
}
