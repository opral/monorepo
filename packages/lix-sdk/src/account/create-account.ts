import type { Lix } from "../lix/open-lix.js";
import type { Account } from "./database-schema.js";

export async function createAccount(args: {
	lix: Lix;
	name: string;
}): Promise<Account> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const account = await trx
			.insertInto("account")
			.values({
				name: args.name,
			})
			.returningAll()
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
