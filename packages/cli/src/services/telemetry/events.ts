import type { coreUsedConfigEvent } from "@inlang/telemetry"

/**
 * Typesafe telemetry events.
 *
 * Exists to avoid typos/always set the correct event name and properties.
 */
export type TelemetryEvents =
	| "CLI command executed"
	| "CLI started"
	| typeof coreUsedConfigEvent.name
