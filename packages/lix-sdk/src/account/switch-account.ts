import type { Lix } from "../lix/open-lix.js";
import type { Account } from "./database-schema.js";

/**
 * Switch the current account to the provided account.
 *
 * @example
 *   ```ts
 *   await switchAccount({ lix, to: otherAccount });
 *   ```
 */
export async function switchAccount(args: {
	lix: Pick<Lix, "db">;
	to: Pick<Account, "id">;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// delete all rows from the current_account table
		await trx.deleteFrom("current_account").execute();
		// insert the new account id into the current_account table
		await trx
			.insertInto("current_account")
			.values({ id: args.to.id })
			.execute();
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
