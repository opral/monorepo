import type { Branch } from "../database/schema.js";
import type { Lix } from "../open/openLix.js";

/**
 * Switches the current branch to the given branch.
 *
 * The branch must already exist before calling this function.
 *
 * @example
 *   ```ts
 *   await switchBranch({ lix, to: { id: "branch-1" } });
 *   ```
 *
 * @example
 *   Switching branches to a newly created branch.
 *
 *   ```ts
 *   await lix.db.transaction().execute(async (trx) => {
 *      const newBranch = await createBranch({ lix: { db: trx }, from: currentBranch });
 *      await switchBranch({ lix: { db: trx }, to: newBranch });
 *   });
 *   ```
 */
export async function switchBranch(args: {
	lix: Pick<Lix, "db">;
	to: Pick<Branch, "id">;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		await trx.updateTable("current_branch").set({ id: args.to.id }).execute();
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
