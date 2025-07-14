import type { Lix } from "../../lix/open-lix.js";
import { isDeterministicMode } from "../is-deterministic-mode.js";
import { nextDeterministicCount } from "../../state/deterministic-counter.js";

/**
 * Returns a timestamp that is deterministic in deterministic mode.
 * In deterministic mode, returns timestamps starting from Unix epoch (1970-01-01).
 * Otherwise returns the current ISO timestamp.
 *
 * @example
 * // Normal mode - returns current time
 * const lix = await openLix();
 * timestamp({ lix }); // "2024-03-15T10:30:45.123Z"
 *
 * @example
 * // Deterministic mode - returns sequential timestamps from epoch
 * const lix = await openLix({
 *   keyValues: [{ key: "lix_deterministic_mode", value: true }]
 * });
 * timestamp({ lix }); // "1970-01-01T00:00:00.050Z"
 * timestamp({ lix }); // "1970-01-01T00:00:00.051Z"
 * timestamp({ lix }); // "1970-01-01T00:00:00.052Z"
 *
 * @example
 * // Use in database operations
 * await lix.db
 *   .insertInto("log")
 *   .values({
 *     id: "log1",
 *     created_at: timestamp({ lix }),
 *     message: "User logged in"
 *   })
 *   .execute();
 */
export function timestamp(args: { lix: Pick<Lix, "sqlite"> }): string {
	const result = args.lix.sqlite.exec({
		sql: "SELECT lix_timestamp() as timestamp",
		returnValue: "resultRows",
	});

	return result[0]?.[0] as string;
}

/**
 * Creates and registers the lix_timestamp SQLite function.
 * This function returns deterministic timestamps in deterministic mode.
 */
export function createTimestampFunction(args: {
	lix: Pick<Lix, "sqlite" | "db">;
}): void {
	args.lix.sqlite.createFunction({
		name: "lix_timestamp",
		arity: 0,
		xFunc: (): string => {
			// Check if deterministic mode is enabled
			if (isDeterministicMode({ lix: args.lix })) {
				// Get the next deterministic counter value
				const counter = nextDeterministicCount({
					sqlite: args.lix.sqlite,
					db: args.lix.db as any, // db includes both LixDatabaseSchema and LixInternalDatabaseSchema
				});
				// Use counter as milliseconds since epoch
				return new Date(counter).toISOString();
			}

			// Return current timestamp in ISO format
			return new Date().toISOString();
		},
	});
}
