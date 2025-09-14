import { executeSync } from "../database/execute-sync.js";
import type { LixEngine } from "../engine/boot.js";

const DEFAULT_LOG_LEVELS = ["info", "warn", "error"];

/**
 * Determines if a log entry should be created based on the configured log levels.
 *
 * @param logLevelsValue - The configured log levels (e.g., ["info", "warn", "error"] or ["*"])
 * @param level - The level of the log entry to check
 * @returns true if the log should be created, false otherwise
 */
export function shouldLog(
	logLevelsValue: string[] | undefined,
	level: string
): boolean {
	return (
		(logLevelsValue === undefined && DEFAULT_LOG_LEVELS.includes(level)) ||
		(logLevelsValue && logLevelsValue.includes("*")) ||
		(logLevelsValue?.includes(level) ?? false)
	);
}

/**
 * Creates a log entry in the Lix database, applying log level filtering.
 *
 * Reads the `lix_log_levels` key from the key-value store. This key is expected
 * to contain a JSON string representation of an array of allowed log level strings
 * (e.g., '["info", "warn", "error"]').
 *
 * Use '["*"]' to log all levels.
 *
 * If the key is missing, invalid JSON, or not an array, it defaults to
 * `["info", "warn", "error"]`. The log entry is only created if the provided
 * `level` is included in the determined list of allowed levels or if the list is '["*"]'.
 *
 * It is recommended to use dot notation for log keys (e.g., 'app.module.component').
 *
 * @example
 * // Basic info log (will be logged if 'info' is allowed by lix_log_levels)
 * createLixOwnLog({
 *   engine: { sqlite: lix.sqlite, db: lix.db },
 *   key: 'app.init',
 *   level: 'info',
 *   message: 'Application started.'
 * });
 *
 * @example
 * // Log a warning (will be logged if 'warn' is allowed by lix_log_levels)
 * createLixOwnLog({
 *   engine: { sqlite: lix.sqlite, db: lix.db },
 *   key: 'user.login.failed',
 *   level: 'warn',
 *   message: `Login failed for user ${userId}`
 * });
 *
 * @example
 * // Configure to log everything (set lix_log_levels to '["*"]')
 * await lix.db.insertInto('key_value').values({
 *   key: 'lix_log_levels',
 *   value: '["*"]',
 *   skip_change_control: true
 * }).onConflict(oc => oc.column('key').doUpdateSet({ value: '["*"]' })).execute();
 *
 * @example
 * // Configure to log only custom levels (set lix_log_levels to '["audit", "critical"]')
 * await lix.db.insertInto('key_value').values({
 *   key: 'lix_log_levels',
 *   value: '["audit", "critical"]',
 *   skip_change_control: true
 * }).onConflict(oc => oc.column('key').doUpdateSet({ value: '["audit", "critical"]' })).execute();
 * // Only logs with level 'audit' or 'critical' will be stored
 *
 * @returns A promise that resolves with the created log entry, or undefined if filtered out.
 */
export function createLixOwnLogSync(args: {
	engine: Pick<LixEngine, "sqlite" | "db">;
	message: string;
	level: string;
	key: string;
}): void {
	const logLevels = executeSync({
		engine: args.engine,
		query: args.engine.db
			.selectFrom("key_value")
			.select("value")
			.where("key", "=", "lix_log_levels"),
	})[0];

	// Check if the level is allowed
	if (!shouldLog(logLevels?.value, args.level)) {
		return undefined; // Filtered out
	}

	// Insert the log
	executeSync({
		engine: args.engine,
		query: args.engine.db.insertInto("log").values({
			key: args.key,
			message: args.message,
			level: args.level,
		}),
	});
}

export async function createLixOwnLog(args: {
	engine: Pick<LixEngine, "sqlite" | "db">;
	message: string;
	level: string;
	key: string;
}): Promise<void> {
	return createLixOwnLogSync(args);
}
