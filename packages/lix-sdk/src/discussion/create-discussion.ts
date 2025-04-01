import type { ChangeSet, Comment, Discussion } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

/**
 * Creates a new discussion with the first comment.
 * 
 * Can be associated with a change set if provided.
 *
 * @example
 *   ```ts
 *   // With a change set
 *   const changeSet = await createChangeSet({ lix, changes: ["change1", "change2"] });
 *   const discussion = await createDiscussion({ 
 *     lix, 
 *     firstComment: { content: "first comment" },
 *     changeSet // optional
 *   });
 *   
 *   // Without a change set (for inline annotations, etc.)
 *   const discussion = await createDiscussion({ 
 *     lix, 
 *     firstComment: { content: "This is an inline annotation" }
 *   });
 *   ```
 *
 * @returns the created discussion
 */
export async function createDiscussion(args: {
	lix: Pick<Lix, "db">;
	firstComment: Pick<Comment, "content">;
	changeSet?: Pick<ChangeSet, "id">;
}): Promise<Discussion & { firstComment: Comment }> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// Create the discussion
		const discussion = await trx
			.insertInto("discussion")
			.values({})
			.returningAll()
			.executeTakeFirstOrThrow();
		
		// If a change set was provided, update it with the discussion ID
		if (args.changeSet) {
			await trx
				.updateTable("change_set")
				.set({
					discussion_id: discussion.id,
				})
				.where("id", "=", args.changeSet.id)
				.execute();
		}

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
