/**
 * Typesafe telemetry events.
 *
 * Exists to avoid typos/always set the correct event name and properties.
 */
export type TelemetryEvents =
	| "IDE-EXTENSION activated"
	| "IDE-EXTENSION code action resolved"
	| "IDE-EXTENSION jumped to position in editor"
	| "IDE-EXTENSION command executed: Extract Message"
	| "IDE-EXTENSION command executed: Create Message"
	| "IDE-EXTENSION completed add to workspace recommendations"
	| "IDE-EXTENSION completed create config file"
	| "IDE-EXTENSION loaded project"
	| "IDE-EXTENSION Editor opened via tooltip"
	| "IDE-EXTENSION Settings View opened"
	| "IDE-EXTENSION Editor View opened"
	| "IDE-EXTENSION recommendation: add Sherlock to workspace"
	| "IDE-EXTENSION recommendation: add Ninja Github Action workflow to repository"
