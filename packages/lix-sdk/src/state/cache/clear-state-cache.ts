import type { Kysely } from "kysely";
import type { Lix } from "../../lix/open-lix.js";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";

/**
 * Clears the internal state cache.
 */
export async function clearStateCache(args: { lix: Lix }): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		await (trx as unknown as Kysely<LixInternalDatabaseSchema>)
			.deleteFrom("internal_state_cache")
			.execute();
	};
	if (args.lix.db.isTransaction) {
		return await args.lix.db.transaction().execute(executeInTransaction);
	} else {
		return await executeInTransaction(args.lix.db);
	}
}
