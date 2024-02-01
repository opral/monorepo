import type { StackInfo } from "./stack-detection.js"

/**
 * Typesafe telemetry events.
 *
 * Exists to avoid typos/always set the correct event name and properties.
 */
export type EventMap =
	| {
			event: "PARAGLIDE-JS compile executed"
			properties: {
				stack: StackInfo
			}
	  }
	| {
			event:
				| "PARAGLIDE-JS init started"
				| "PARAGLIDE-JS init project initialized"
				| "PARAGLIDE-JS init added to devDependencies"
				| "PARAGLIDE-JS init added compile commands"
				| "PARAGLIDE-JS init finished"
	  }
