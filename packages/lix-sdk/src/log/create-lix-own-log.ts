import { executeSync } from "../database/execute-sync.js";
import type { Lix } from "../lix/open-lix.js";

const DEFAULT_LOG_LEVELS = ["info", "warn", "error"];

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
 *   lix,
 *   key: 'app.init',
 *   level: 'info',
 *   message: 'Application started.'
 * });
 *
 * @example
 * // Log a warning (will be logged if 'warn' is allowed by lix_log_levels)
 * createLixOwnLog({
 *   lix,
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
	lix: Pick<Lix, "sqlite" | "db">;
	message: string;
	level: string;
	key: string;
}): void {
	const logLevels = executeSync({
		lix: args.lix,
		query: args.lix.db
			.selectFrom("key_value")
			.select("value")
			.where("key", "=", "lix_log_levels"),
	})[0];

	// Check if the level is allowed
	const shouldLog =
		(logLevels === undefined && DEFAULT_LOG_LEVELS.includes(args.level)) ||
		(logLevels?.value && logLevels.value.includes("*")) ||
		logLevels?.value.includes(args.level);

	if (!shouldLog) {
		return undefined; // Filtered out
	}

	// Insert the log
	executeSync({
		lix: args.lix,
		query: args.lix.db.insertInto("log").values({
			key: args.key,
			message: args.message,
			level: args.level,
		}),
	});
}

export async function createLixOwnLog(args: {
	lix: Pick<Lix, "db">;
	message: string;
	level: string;
	key: string;
}): Promise<void> {
	const logLevels = await args.lix.db
		.selectFrom("key_value")
		.select("value")
		.where("key", "=", "lix_log_levels")
		.executeTakeFirst();

	// Check if the level is allowed
	const shouldLog =
		(logLevels === undefined && DEFAULT_LOG_LEVELS.includes(args.level)) ||
		(logLevels?.value && (logLevels.value as string[]).includes("*")) ||
		(logLevels?.value as string[]).includes(args.level);

	if (!shouldLog) {
		return undefined; // Filtered out
	}

	// Insert the log
	await args.lix.db
		.insertInto("log")
		.values({
			key: args.key,
			message: args.message,
			level: args.level,
		})
		.execute();
}
