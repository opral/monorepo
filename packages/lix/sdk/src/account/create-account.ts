import { nanoId } from "../engine/functions/nano-id.js";
import type { Lix } from "../lix/open-lix.js";
import type { LixAccount } from "./schema-definition.js";

/**
 * Inserts a new account into the Lix database.
 *
 * Accounts represent different identities working with the same Lix
 * file. Switching the active account is handled separately via
 * {@link switchAccount}.
 *
 * @example
 * ```ts
 * const account = await createAccount({ lix, name: "Jane" })
 * ```
 */

export async function createAccount(args: {
	lix: Lix;
	id?: LixAccount["id"];
	name: LixAccount["name"];
}): Promise<LixAccount> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Generate ID if not provided (views handle this, but we need it for querying back)
		const accountId =
			args.id || (await nanoId({ lix: { ...args.lix, db: trx } }));
		// Insert the account (views don't support returningAll)
		await trx
			.insertInto("account_by_version")
			.values({
				id: accountId,
				name: args.name,
			})
			.execute();

		// Query back the inserted account
		let selectQuery = trx
			.selectFrom("account")
			.selectAll()
			.where("id", "=", accountId);

		const account = await selectQuery.executeTakeFirstOrThrow();

		return account;
	};

	// user provided an open transaction
	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
