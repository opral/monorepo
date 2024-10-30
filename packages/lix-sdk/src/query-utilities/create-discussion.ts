import type { ChangeSet, Comment, Discussion } from "../database/schema.js";
import type { Lix } from "../open/openLix.js";

/**
 * Creates a new discussion with the first comment.
 *
 * @example
 *   ```ts
 *   const changeSet = await createChangeSet({ lix, changes: ["change1", "change2"] });
 *   const discussion = await createDiscussion({ lix, changeSet, body: "first comment" });
 *   ```
 *
 * @returns the created discussion
 */
export async function createDiscussion(args: {
	lix: Pick<Lix, "db">;
	changeSet: Pick<ChangeSet, "id">;
	content: Comment["content"];
}): Promise<Discussion & { comment: Comment }> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const discussion = await trx
			.insertInto("discussion")
			.values({
				change_set_id: args.changeSet.id,
			})
			.returningAll()
			.executeTakeFirstOrThrow();

		const comment = await trx
			.insertInto("comment")
			.values({
				parent_id: null,
				discussion_id: discussion.id,
				content: args.content,
			})
			.returningAll()
			.executeTakeFirstOrThrow();

		return { ...discussion, comment };
	};

	// user provided an open transaction
	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
