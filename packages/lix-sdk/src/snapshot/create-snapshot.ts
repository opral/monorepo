import type { Snapshot } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import { jsonb } from "../database/json.js";

/**
 * Creates a snapshot and inserts it or retrieves the existing snapshot from the database.
 *
 * Snapshots are content-addressed to avoid storing the same snapshot multiple times.
 * Hence, an insert might not actually insert a new snapshot but return an existing one.
 *
 * @example
 *   ```ts
 *   const snapshot = await createSnapshot({ lix, content });
 *   ```
 */
export async function createSnapshot(args: {
	lix: Pick<Lix, "db">;
	content?: Snapshot["content"];
}): Promise<Snapshot> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const snapshot = await trx
			.insertInto("snapshot")
			.values({
				content: args.content ? jsonb(args.content) : null,
			})
			.onConflict((oc) =>
				oc.doUpdateSet((eb) => ({
					content: eb.ref("excluded.content"),
				}))
			)
			.returningAll()
			.executeTakeFirstOrThrow();
		return snapshot;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
