import type { Lix } from "../lix/open-lix.js";

export async function withSkipOwnChangeControl<T>(
	db: Lix["db"],
	operation: (trx: Lix["db"]) => Promise<T>
): Promise<T> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		await trx
			.insertInto("key_value")
			.values({
				key: "lix_skip_own_change_control",
				value: "true",
				skip_change_control: true,
			})
			.onConflict((oc) => oc.doUpdateSet({ value: "true" }))
			.execute();

		// Perform the user's operation
		const result = await operation(trx);

		await trx
			.deleteFrom("key_value")
			.where("key", "=", "lix_skip_own_change_control")
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
