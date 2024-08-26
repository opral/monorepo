import { Kysely } from "kysely";
import type { LixDatabase } from "./schema.js";
import { v4 } from "uuid";

export async function commit(args: {
	db: Kysely<LixDatabase>;
	currentAuthor?: string;
	// TODO remove description
	description: string;
}) {
	const newCommitId = v4();

	return args.db.transaction().execute(async (trx) => {
		const { commit_id: parent_id } = await trx
			.selectFrom("ref")
			.select("commit_id")
			.where("name", "=", "current")
			.executeTakeFirstOrThrow();

		const commit = await trx
			.insertInto("commit")
			.values({
				id: newCommitId,
				author: args.currentAuthor,
				// todo - use zoned datetime
				description: args.description,
				parent_id,
			})
			.returning("id")
			.executeTakeFirstOrThrow();

		await trx
			.updateTable("ref")
			.where("name", "=", "current")
			.set({ commit_id: newCommitId })
			.execute();

		// if (!args.merge) {
		// 	// look for all conflicts and remove them if there is a new change that has same id
		// 	// TODO: needs checking of type and plugin? and integrate into one sql statement
		// 	const newChanges = (
		// 		await trx.selectFrom("change").where("commit_id", "is", null).selectAll().execute()
		// 	).map((change) => change.value.id)

		// 	await trx
		// 		.updateTable("change")
		// 		.set({
		// 			conflict: null,
		// 		})
		// 		.where("conflict", "is not", null)
		// 		.where((eb) => eb.ref("value", "->>").key("id"), "in", newChanges)
		// 		.execute()
		// }

		return await trx
			.updateTable("change")
			.where("commit_id", "is", null)
			.set({
				commit_id: commit.id,
			})
			.execute();
	});
}
