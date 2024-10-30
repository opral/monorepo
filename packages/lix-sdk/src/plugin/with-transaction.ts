import type { Transaction } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import type { Lix } from "../open/openLix.js";
import type { LixReadonly } from "./lix-plugin.js";

/**
 * Turns a `Lix` into a `LixReadonly`.
 *
 * TODO https://github.com/opral/lix-sdk/issues/123
 */
export function withTransaction(
	lix: Lix,
	trx: Transaction<LixDatabaseSchema>,
): LixReadonly {
	return {
		db: {
			selectFrom: trx.selectFrom,
		},
		plugin: lix.plugin,
	};
}
