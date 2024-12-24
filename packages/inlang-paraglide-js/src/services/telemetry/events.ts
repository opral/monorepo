/**
 * Typesafe telemetry events.
 *
 * Exists to avoid typos/always set the correct event name and properties.
 */
export type TelemetryEvents =
  | "PARAGLIDE-JS compile executed"
  | "PARAGLIDE-JS init started"
  | "PARAGLIDE-JS init project initialized"
  | "PARAGLIDE-JS init added to devDependencies"
  | "PARAGLIDE-JS init added compile commands"
  | "PARAGLIDE JS init added Ninja"
  | "PARAGLIDE JS init added Sherlock"
  | "PARAGLIDE-JS init finished";
