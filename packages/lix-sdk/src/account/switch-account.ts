import type { Lix } from "../lix/open-lix.js";
import type { LixAccount } from "./schema.js";

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
		// delete all rows from the current_account table
		await trx.deleteFrom("active_account").execute();
		// insert the new account id into the current_account table
		// active_account table only has id and name columns
		await trx
			.insertInto("active_account")
			.values(
				args.to.map((account) => ({
					id: account.id,
					name: account.name,
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
