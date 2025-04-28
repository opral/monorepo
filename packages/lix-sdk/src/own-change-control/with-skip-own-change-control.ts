import type { Lix } from "../lix/open-lix.js";

export async function withSkipOwnChangeControl<T>(
	db: Lix["db"],
	operation: (trx: Lix["db"]) => Promise<T>
): Promise<T> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const nestingLevel = await trx
			.selectFrom("key_value")
			.select("value")
			.where("key", "=", "lix_skip_own_change_control")
			.executeTakeFirst();

		const currentLevel = nestingLevel ? parseInt(nestingLevel.value) : 0;

		await trx
			.insertInto("key_value")
			.values({
				key: "lix_skip_own_change_control",
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
				.where("key", "=", "lix_skip_own_change_control")
				.execute();
		} else {
			// Decrement the nesting level
			//
			// The current level is already the decremented level given that
			// the initial increment is 0 + 1.
			await trx
				.updateTable("key_value")
				.set({
					value: `${currentLevel}`,
				})
				.where("key", "=", "lix_skip_own_change_control")
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
