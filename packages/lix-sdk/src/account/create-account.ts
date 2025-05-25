import type { Lix } from "../lix/open-lix.js";
import type { Account, NewAccount } from "./schema.js";
import { v7 as uuid_v7 } from "uuid";

export async function createAccount(args: {
	lix: Pick<Lix, "db">;
	data: Omit<NewAccount, "version_id"> & { version_id?: string };
}): Promise<Account> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Generate ID if not provided (views handle this, but we need it for querying back)
		const accountId = args.data.id || uuid_v7();
		
		// Insert the account (views don't support returningAll)
		await trx
			.insertInto("account")
			.values({
				id: accountId,
				name: args.data.name,
				version_id: args.data.version_id,
			})
			.execute();

		// Query back the inserted account
		const account = await trx
			.selectFrom("account")
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
