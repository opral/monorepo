import type { Lix } from "../lix/open-lix.js";

export async function withSkipChangeQueue<T>(
	db: Lix["db"],
	operation: (trx: Lix["db"]) => Promise<T>,
): Promise<T> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const queryEntryBefore = await trx
			.selectFrom("change_queue")
			.selectAll()
			.orderBy("id desc")
			.executeTakeFirst();

		// Perform the user's operation
		const result = await operation(trx);

		// delete queue entries that came after
		// the queue entry before the transaction

		await trx
			.deleteFrom("change_queue")
			.where("id", ">", queryEntryBefore?.id ?? 0)
			.execute();

		// Return the result of the operation
		return result;
	};
	if (db.isTransaction) {
		return executeInTransaction(db);
	} else {
		return db.transaction().execute(executeInTransaction);
	}
}
