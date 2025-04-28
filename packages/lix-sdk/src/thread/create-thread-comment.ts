import type { NewThreadComment, ThreadComment } from "./database-schema.js";
import type { Lix } from "../lix/open-lix.js";

export async function createThreadComment(
	args: { lix: Lix } & NewThreadComment
): Promise<ThreadComment> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		return await trx
			.insertInto("thread_comment")
			.values({
				thread_id: args.thread_id,
				body: args.body,
				parent_id: args.parent_id,
			})
			.returningAll()
			.executeTakeFirstOrThrow();
	};

	if (args.lix.db.isTransaction) {
		return await executeInTransaction(args.lix.db);
	} else {
		return await args.lix.db.transaction().execute(executeInTransaction);
	}
}
