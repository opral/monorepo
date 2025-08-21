import type { Lix } from "../lix/open-lix.js";
import type { LixVersion } from "./schema.js";

/**
 * Switches the current Version to the given Version.
 *
 * The Version must already exist before calling this function.
 *
 * @example
 *   ```ts
 *   await switchVersion({ lix, to: otherVersion });
 *   ```
 *
 * @example
 *   Switching to a newly created version.
 *
 *   ```ts
 *   await lix.db.transaction().execute(async (trx) => {
 *      const newVersion = await createVersion({ lix: { db: trx }, commit: currentVersion });
 *      await switchVersion({ lix: { db: trx }, to: newVersion });
 *   });
 *   ```
 */
export async function switchVersion(args: {
	lix: Lix;
	to: Pick<LixVersion, "id">;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		await trx
			.updateTable("active_version")
			.set({ version_id: args.to.id })
			.execute();
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
