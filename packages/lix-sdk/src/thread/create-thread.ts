import type { Lix } from "../lix/open-lix.js";
import type { NewThreadComment, Thread, ThreadComment } from "./schema.js";
import { nanoid } from "../database/nano-id.js";

export async function createThread(args: {
	lix: Lix;
	id?: string;
	comments?: Pick<NewThreadComment, "body">[];
}): Promise<Thread & { comments: ThreadComment[] }> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const threadId = args.id ?? nanoid();

		await trx.insertInto("thread").values({ id: threadId }).execute();

		const thread = await trx
			.selectFrom("thread")
			.selectAll()
			.where("id", "=", threadId)
			.executeTakeFirstOrThrow();

		const insertedComments: ThreadComment[] = [];

		for (const [index, comment] of (args.comments ?? []).entries()) {
			const commentId = nanoid();

			await trx
				.insertInto("thread_comment")
				.values({
					id: commentId,
					thread_id: thread.id,
					body: comment.body,
					parent_id: index > 0 ? insertedComments[index - 1]!.id : null,
				})
				.execute();

			const insertedComment = await trx
				.selectFrom("thread_comment")
				.selectAll()
				.where("id", "=", commentId)
				.executeTakeFirstOrThrow();

			insertedComments.push(insertedComment);
		}

		return { ...thread, comments: insertedComments };
	};

	if (args.lix.db.isTransaction) {
		return await executeInTransaction(args.lix.db);
	} else {
		return await args.lix.db.transaction().execute(executeInTransaction);
	}
}
