import { telemetryNode } from "@inlang/telemetry"
import { getTelemetryGroups } from "./getTelemetryGroups.js"

export const telemetry: Omit<typeof telemetryNode, "capture"> & { capture: typeof capture } =
	new Proxy(telemetryNode, {
		get(target, prop) {
			if (prop === "capture") {
				console.log("capturing")
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
	| (Omit<Parameters<typeof telemetryNode.capture>[0], "distinctId" | "groups"> & {
			event: "IDE-EXTENSION activated"
	  })
	| {
			event: "IDE-EXTENSION code action provided"
			properties: {
				name: "extract message"
			}
	  }
	| {
			event: "IDE-EXTENSION code action resolved"
			properties: {
				name: "extract message"
			}
	  }
	| {
			event: "IDE-EXTENSION decoration set"
			properties: {
				name: "message preview"
			}
	  }
	| {
			event: "IDE-EXTENSION command executed"
			properties: {
				name: "extract message"
			}
	  }

/**
 * Capture a telemetry event in a typesafe way.
 */
async function capture(args: CaptureEventArguments) {
	console.log("hello world from capture")
	return telemetryNode.capture({
		...args,
		distinctId: "unknown",
		groups: await getTelemetryGroups(),
	})
}
