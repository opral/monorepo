import type { Lix } from "../../lix/open-lix.js";
import { randomNanoId } from "../nano-id.js";
import { isDeterministicMode } from "../is-deterministic-mode.js";
import { nextDeterministicCount } from "../../state/deterministic-counter.js";

/**
 * Returns a nanoid that is deterministic in deterministic mode.
 * In deterministic mode, returns deterministic IDs with sequential counters.
 * Otherwise returns a random nanoid.
 *
 * @example
 * // Normal mode - returns random nanoid
 * const lix = await openLix();
 * nanoId({ lix }); // "V1StGXR8_Z5jdHi6B-myT"
 *
 * @example
 * // Deterministic mode - returns sequential IDs with test_ prefix
 * const lix = await openLix({
 *   keyValues: [{ key: "lix_deterministic_mode", value: true }]
 * });
 * nanoId({ lix }); // "test_0000000050"
 * nanoId({ lix }); // "test_0000000051"
 * nanoId({ lix }); // "test_0000000052"
 *
 * @example
 * // Use in database operations
 * await lix.db
 *   .insertInto("label")
 *   .values({
 *     id: nanoId({ lix }),
 *     name: "bug",
 *     color: "#ff0000"
 *   })
 *   .execute();
 */
export function nanoId(args: { lix: Pick<Lix, "sqlite"> }): string {
	const result = args.lix.sqlite.exec({
		sql: "SELECT lix_nano_id() as id",
		returnValue: "resultRows",
	});

	return result[0]?.[0] as string;
}

/**
 * Creates and registers the lix_nano_id SQLite function.
 * This function returns deterministic nano IDs in deterministic mode.
 */
export function createNanoIdFunction(args: {
	lix: Pick<Lix, "sqlite" | "db">;
}): void {
	args.lix.sqlite.createFunction({
		name: "lix_nano_id",
		arity: 0,
		xFunc: (): string => {
			// Check if deterministic mode is enabled
			if (isDeterministicMode({ lix: args.lix })) {
				// Get the next deterministic counter value
				const counter = nextDeterministicCount({
					sqlite: args.lix.sqlite,
					db: args.lix.db as any, // db includes both LixDatabaseSchema and LixInternalDatabaseSchema
				});
				// Return counter with test_ prefix and padded to 10 digits
				return `test_${counter.toString().padStart(10, "0")}`;
			}

			// Return regular nanoid
			return randomNanoId();
		},
	});
}

/**
 * Creates and registers the lix_random_nano_id SQLite function.
 * Always returns a random nanoid regardless of deterministic mode.
 */
export function createRandomNanoIdFunction(args: {
	sqlite: import("sqlite-wasm-kysely").SqliteWasmDatabase;
}): void {
	args.sqlite.createFunction({
		name: "lix_random_nano_id",
		arity: 1,
		xFunc: (_ctx: number, ...args: any[]): string => {
			const length = args[0] as number | undefined;
			return randomNanoId(length);
		},
	});
}