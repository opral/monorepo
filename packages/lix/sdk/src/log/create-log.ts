import { nanoId } from "../engine/deterministic/nano-id.js";
import type { State } from "../entity-views/types.js";
import type { Lix } from "../lix/open-lix.js";
import type { LixLog } from "./schema.js";

/**
 * Directly creates a log entry in the Lix database without applying any filters.
 *
 * This function inserts the log entry regardless of the `lix_log_levels` setting
 * in the key-value store. It is the responsibility of the calling application
 * to implement any desired log level filtering before invoking this function.
 *
 * Use `snake_case` for log keys (e.g., `app_checkout_submit`) to keep filters predictable.
 *
 * @example
 * // Directly log an info message
 *
 * if (shouldLog) {
 *   await createLog({
 *     lix,
 *     key: 'app_init',
 *     level: 'info',
 *     message: 'Application initialized'
 * });
 *
 * @returns A promise that resolves with the created log entry.
 */
export async function createLog(args: {
	lix: Lix;
	message: string;
	level: string;
	key: string;
}): Promise<State<LixLog>> {
	// Insert the log entry
	const id = await nanoId({ lix: args.lix });
	await args.lix.db
		.insertInto("log")
		.values({
			id,
			key: args.key,
			message: args.message,
			level: args.level,
		})
		.execute();

	// Query to get the created log entry
	return await args.lix.db
		.selectFrom("log")
		.where("id", "=", id)
		.selectAll()
		.executeTakeFirstOrThrow();
}
