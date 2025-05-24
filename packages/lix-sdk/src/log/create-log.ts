import type { Lix } from "../lix/open-lix.js";
import type { Log } from "./schema.js";

/**
 * Directly creates a log entry in the Lix database without applying any filters.
 *
 * This function inserts the log entry regardless of the `lix_log_levels` setting
 * in the key-value store. It is the responsibility of the calling application
 * to implement any desired log level filtering before invoking this function.
 *
 * It is recommended to use dot notation for log keys (e.g., 'app.module.component').
 *
 * @example
 * // Directly log an info message
 *
 * if (shouldLog) {
 *   await createLog({
 *     lix,
 *     key: 'app.init',
 *     level: 'info',
 *     message: 'Application initialized'
 * });
 *
 * @returns A promise that resolves with the created log entry.
 */
export async function createLog(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	message: string;
	level: string;
	key: string;
}): Promise<Log> {
	return await args.lix.db
		.insertInto("log")
		.values({
			key: args.key,
			message: args.message,
			level: args.level,
		})
		.returningAll()
		.executeTakeFirstOrThrow();
}
