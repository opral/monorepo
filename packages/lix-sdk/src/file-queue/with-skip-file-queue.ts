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
		const nestingLevel = await trx
			.selectFrom("key_value")
			.select("value")
			.where("key", "=", "lix_skip_file_queue")
			.executeTakeFirst();

		const currentLevel = nestingLevel ? parseInt(nestingLevel.value) : 0;

		await trx
			.insertInto("key_value")
			.values({
				key: "lix_skip_file_queue",
				value: `${currentLevel + 1}`,
				skip_change_control: true,
			})
			.onConflict((oc) => oc.doUpdateSet({ value: `${currentLevel + 1}` }))
			.execute();

		// Perform the user's operation
		const result = await operation(trx);

		// Remove the skip flag if this is the outermost transaction
		if (currentLevel === 0) {
			await trx
				.deleteFrom("key_value")
				.where("key", "=", "lix_skip_file_queue")
				.execute();
		} else {
			// Decrement the nesting level
			await trx
				.updateTable("key_value")
				.set({
					value: `${currentLevel}`,
				})
				.where("key", "=", "lix_skip_file_queue")
				.execute();
		}

		// Return the result of the operation
		return result;
	};
	if (db.isTransaction) {
		return executeInTransaction(db);
	} else {
		return db.transaction().execute(executeInTransaction);
	}
}
