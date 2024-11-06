import { sha256 } from "js-sha256";
import type { Snapshot } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

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
		try {
			const snapshot = await trx
				.insertInto("snapshot")
				.values({
					content: args.content ?? null,
				})
				.returningAll()
				.executeTakeFirstOrThrow();
			return snapshot;
		} catch (error) {
			// the snapshot already exists (content addressable)
			// return the existing snapshot
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if ((error as unknown as any)?.resultCode === 2067) {
				const id = sha256(JSON.stringify(args.content));
				return await trx
					.selectFrom("snapshot")
					.where("id", "=", id)
					.selectAll()
					.executeTakeFirstOrThrow();
			}
			throw error;
		}
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
