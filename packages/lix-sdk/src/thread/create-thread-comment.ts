import type { NewThreadComment, ThreadComment } from "./schema.js";
import type { Lix } from "../lix/open-lix.js";
import { nanoid } from "../database/nano-id.js";

export async function createThreadComment(
	args: { lix: Lix } & NewThreadComment
): Promise<ThreadComment> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const commentId = args.id ?? nanoid();

		await trx
			.insertInto("thread_comment")
			.values({
				id: commentId,
				thread_id: args.thread_id,
				body: args.body,
				parent_id: args.parent_id,
			})
			.execute();

		return await trx
			.selectFrom("thread_comment")
			.selectAll()
			.where("id", "=", commentId)
			.executeTakeFirstOrThrow();
	};

	if (args.lix.db.isTransaction) {
		return await executeInTransaction(args.lix.db);
	} else {
		return await args.lix.db.transaction().execute(executeInTransaction);
	}
}
