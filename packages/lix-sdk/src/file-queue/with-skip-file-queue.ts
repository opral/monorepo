import type { Lix } from "../lix/open-lix.js";

/**
 * Wraps a database operation in a transaction and skips file queue entries.
 *
 * Use this function if you want to perform a database operation that should
 * not trigger the file queue to detect changes in the operation you are about to perform.
 *
 * @example
 *   await withSkipFileQueue(lix.db, async (trx) => {
 *     await trx
 *       .insertInto("file")
 *       .values({
 *         id: "test",
 *         data: new TextEncoder().encode("update0"),
 *         path: "/test.txt",
 *       })
 *       .execute();
 *   });
 */
export async function withSkipFileQueue<T>(
	db: Lix["db"],
	operation: (trx: Lix["db"]) => Promise<T>
): Promise<T> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const queryEntryBefore = await trx
			.selectFrom("file_queue")
			.selectAll()
			.orderBy("id desc")
			.executeTakeFirst();

		// Perform the user's operation
		const result = await operation(trx);

		// delete queue entries that came after
		// the queue entry before the transaction

		await trx
			.deleteFrom("file_queue")
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
