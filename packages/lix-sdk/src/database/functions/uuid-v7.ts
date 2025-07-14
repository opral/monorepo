import type { Lix } from "../../lix/open-lix.js";
import { v7 as uuid_v7 } from "uuid";
import { isDeterministicMode } from "../is-deterministic-mode.js";
import { nextDeterministicCount } from "../../state/deterministic-counter.js";

/**
 * Returns a UUID v7 that is deterministic in deterministic mode.
 * In deterministic mode, returns deterministic IDs with sequential counters.
 * Otherwise returns a random UUID v7.
 *
 * @example
 * // Normal mode - returns random UUID v7
 * const lix = await openLix();
 * uuidV7({ lix }); // "01920000-5432-7654-8abc-def012345678"
 *
 * @example
 * // Deterministic mode - returns sequential UUIDs
 * const lix = await openLix({
 *   keyValues: [{ key: "lix_deterministic_mode", value: true }]
 * });
 * uuidV7({ lix }); // "01920000-0000-7000-8000-000000000032"
 * uuidV7({ lix }); // "01920000-0000-7000-8000-000000000033"
 * uuidV7({ lix }); // "01920000-0000-7000-8000-000000000034"
 *
 * @example
 * // Use in database operations
 * await lix.db
 *   .insertInto("change")
 *   .values({
 *     id: uuidV7({ lix }),
 *     content: "Updated user profile"
 *   })
 *   .execute();
 */
export function uuidV7(args: { lix: Pick<Lix, "sqlite"> }): string {
	const result = args.lix.sqlite.exec({
		sql: "SELECT lix_uuid_v7() as id",
		returnValue: "resultRows",
	});

	return result[0]?.[0] as string;
}

/**
 * Creates and registers the lix_uuid_v7 SQLite function.
 * This function returns deterministic UUID v7s in deterministic mode.
 */
export function createUuidV7Function(args: {
	lix: Pick<Lix, "sqlite" | "db">;
}): void {
	args.lix.sqlite.createFunction({
		name: "lix_uuid_v7",
		arity: 0,
		xFunc: (): string => {
			// Check if deterministic mode is enabled
			if (isDeterministicMode({ lix: args.lix })) {
				// Get the next deterministic counter value
				const counter = nextDeterministicCount({
					sqlite: args.lix.sqlite,
					db: args.lix.db as any, // db includes both LixDatabaseSchema and LixInternalDatabaseSchema
				});
				const hex = counter.toString(16).padStart(8, "0");
				return `01920000-0000-7000-8000-0000${hex}`;
			}

			// Return regular UUID v7
			return uuid_v7();
		},
	});
}