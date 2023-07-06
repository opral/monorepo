import type { coreUsedConfigEvent } from "@inlang/telemetry"

/**
 * Typesafe telemetry events.
 *
 * Exists to avoid typos/always set the correct event name and properties.
 */
export type TelemetryEvents =
	| "IDE-EXTENSION activated"
	| "IDE-EXTENSION code action resolved"
	| "IDE-EXTENSION command executed"
	| "IDE-EXTENSION completed add to workspace recommendations"
	| "IDE-EXTENSION completed create config file"
	| typeof coreUsedConfigEvent.name
