import type { Version } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

/**
 * Switches the current Version to the given Version.
 *
 * The Version must already exist before calling this function.
 *
 * @example
 *   ```ts
 *   await switchVersion({ lix, to: currentVersion });
 *   ```
 *
 * @example
 *   Switching Versiones to a newly created Version.
 *
 *   ```ts
 *   await lix.db.transaction().execute(async (trx) => {
 *      const newVersion = await createVersion({ lix: { db: trx }, parent: currentVersion });
 *      await switchVersion({ lix: { db: trx }, to: newVersion });
 *   });
 *   ```
 */
export async function switchVersion(args: {
	lix: Pick<Lix, "db">;
	to: Pick<Version, "id">;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		await trx.updateTable("current_version").set({ id: args.to.id }).execute();
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
