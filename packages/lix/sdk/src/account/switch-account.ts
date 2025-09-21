import type { Lix } from "../lix/open-lix.js";
import type { LixAccount } from "./schema-definition.js";

/**
 * Switch the current account to the provided account.
 *
 * @example
 *
 *   One active account
 *
 *   ```ts
 *   await switchAccount({ lix, to: [otherAccount] });
 *   ```
 *
 * @example
 *
 *   Multiple active accounts
 *
 *   ```ts
 *   await switchAccount({ lix, to: [account1, account2] });
 *   ```
 */
export async function switchAccount(args: {
	lix: Pick<Lix, "db">;
	to: Pick<LixAccount, "id" | "name">[];
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Delete all active account entries (both tracked and untracked)
		await trx.deleteFrom("active_account").execute();

		// insert the new account id into the current_account table
		// active_account view only has account_id column
		await trx
			.insertInto("active_account")
			.values(
				args.to.map((account) => ({
					account_id: account.id,
				}))
			)
			.execute();
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
