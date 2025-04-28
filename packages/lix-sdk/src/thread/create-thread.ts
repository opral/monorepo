import type { Lix } from "../lix/open-lix.js";
import type {
	NewThreadComment,
	Thread,
	ThreadComment,
} from "./database-schema.js";

export async function createThread(args: {
	lix: Lix;
	id?: string;
	comments?: Pick<NewThreadComment, "body">[];
}): Promise<Thread & { comments: ThreadComment[] }> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const thread = await trx
			.insertInto("thread")
			.$if(args.id !== undefined, (qb) => qb.values({ id: args.id }))
			.$if(!args.id, (qb) => qb.defaultValues())
			.returningAll()
			.executeTakeFirstOrThrow();

		const insertedComments: ThreadComment[] = [];

		for (const [index, comment] of (args.comments ?? []).entries()) {
			insertedComments.push(
				await trx
					.insertInto("thread_comment")
					.values({
						thread_id: thread.id,
						body: comment.body,
						parent_id: index > 0 ? insertedComments[index - 1]!.id : null,
					})
					.returningAll()
					.executeTakeFirstOrThrow()
			);
		}

		return { ...thread, comments: insertedComments };
	};

	if (args.lix.db.isTransaction) {
		return await executeInTransaction(args.lix.db);
	} else {
		return await args.lix.db.transaction().execute(executeInTransaction);
	}
}
