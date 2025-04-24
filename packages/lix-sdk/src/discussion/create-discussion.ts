import type { ChangeSet } from "../change-set/database-schema.js";
import type { Comment, Discussion } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

/**
 * Creates a new discussion with the first comment.
 *
 * @example
 *   ```ts
 *   const changeSet = await createChangeSet({ lix, changes: ["change1", "change2"] });
 *   const discussion = await createDiscussion({ lix, changeSet, firstComment: { content: "first comment" } });
 *   ```
 *
 * @returns the created discussion
 */
export async function createDiscussion(args: {
	lix: Pick<Lix, "db">;
	changeSet: Pick<ChangeSet, "id">;
	firstComment: Pick<Comment, "content">;
}): Promise<Discussion & { firstComment: Comment }> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const discussion = await trx
			.insertInto("discussion")
			.values({
				change_set_id: args.changeSet.id,
			})
			.returningAll()
			.executeTakeFirstOrThrow();

		const firstComment = await trx
			.insertInto("comment")
			.values({
				parent_id: null,
				discussion_id: discussion.id,
				content: args.firstComment.content,
			})
			.returningAll()
			.executeTakeFirstOrThrow();

		return { ...discussion, firstComment };
	};

	// user provided an open transaction
	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
