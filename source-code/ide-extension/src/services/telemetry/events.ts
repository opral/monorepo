/**
 * Typesafe telemetry events.
 *
 * Exists to avoid typos/always set the correct event name and properties.
 */
export type TelemetryEvents =
	| "IDE-EXTENSION activated"
	| "IDE-EXTENSION code action provided"
	| "IDE-EXTENSION code action resolved"
	| "IDE-EXTENSION decoration set"
	| "IDE-EXTENSION command executed"
