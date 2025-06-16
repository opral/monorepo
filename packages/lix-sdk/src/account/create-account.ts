import type { Lix } from "../lix/open-lix.js";
import type { Account } from "./schema.js";
import { v7 as uuid_v7 } from "uuid";

export async function createAccount(args: {
	lix: Pick<Lix, "db">;
	id?: Account["id"];
	name: Account["name"];
	lixcol_version_id?: string;
}): Promise<Account> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Generate ID if not provided (views handle this, but we need it for querying back)
		const accountId = args.id || uuid_v7();

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
