import { uuidV7 } from "../deterministic/uuid-v7.js";
import type { Lix } from "../lix/open-lix.js";
import type { LixAccount } from "./schema.js";

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
	lix: Pick<Lix, "db" | "sqlite">;
	id?: LixAccount["id"];
	name: LixAccount["name"];
	lixcol_version_id?: string;
}): Promise<LixAccount> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Generate ID if not provided (views handle this, but we need it for querying back)
		const accountId = args.id || uuidV7({ lix: args.lix });

		// Insert the account (views don't support returningAll)
		await trx
			.insertInto("account_all")
			.values({
				id: accountId,
				name: args.name,
				lixcol_version_id:
					args.lixcol_version_id ??
					trx.selectFrom("active_version").select("version_id"),
			})
			.execute();

		// Query back the inserted account
		const account = await trx
			.selectFrom("account_all")
			.selectAll()
			.where("id", "=", accountId)
			.executeTakeFirstOrThrow();

		return account;
	};

	// user provided an open transaction
	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
