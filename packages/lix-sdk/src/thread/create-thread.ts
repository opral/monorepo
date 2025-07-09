import type { Lix } from "../lix/open-lix.js";
import type { LixThread, LixThreadComment } from "./schema.js";
import { nanoid } from "../database/nano-id.js";
import type { NewState } from "../entity-views/types.js";

/**
 * Starts a new discussion thread.
 *
 * Threads allow collaborators to attach comments to a specific
 * version or entity. Initial comments can be provided and will be
 * inserted sequentially.
 *
 * @example
 * ```ts
 * const thread = await createThread({ lix, comments: [{ body: "Hello" }] })
 * ```
 */

export async function createThread(args: {
	lix: Lix;
	id?: string;
	comments?: Pick<NewState<LixThreadComment>, "body">[];
	/** defaults to global */
	versionId?: string;
}): Promise<
	LixThread & {
		lixcol_version_id: string;
		comments: (LixThreadComment & {
			lixcol_version_id: string;
		})[];
	}
> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const threadId = args.id ?? nanoid();
		const versionId = args.versionId ?? "global";

		await trx
			.insertInto("thread_all")
			.values({ id: threadId, lixcol_version_id: versionId })
			.execute();

		const thread = await trx
			.selectFrom("thread_all")
			.selectAll()
			.where("id", "=", threadId)
			.where("lixcol_version_id", "=", versionId)
			.executeTakeFirstOrThrow();

		const insertedComments = [];

		for (const [index, comment] of (args.comments ?? []).entries()) {
			const commentId = nanoid();

			await trx
				.insertInto("thread_comment_all")
				.values({
					id: commentId,
					thread_id: thread.id,
					body: comment.body,
					parent_id: index > 0 ? insertedComments[index - 1]!.id : null,
					lixcol_version_id: versionId,
				})
				.execute();

			const insertedComment = await trx
				.selectFrom("thread_comment_all")
				.selectAll()
				.where("id", "=", commentId)
				.where("lixcol_version_id", "=", versionId)
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
