import type { ChangeSet, Comment, Discussion } from "../database/schema.js";
import type { Lix } from "../types.js";

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
	lix: Partial<Lix> & { db: { transaction: Lix["db"]["transaction"] } };
	changeSet: Partial<ChangeSet> & { id: ChangeSet["id"] };
	body: Comment["body"];
}): Promise<Discussion> {
	// TODO how to use an open transaction?
	return args.lix.db.transaction().execute(async (trx) => {
		const discussion = await trx
			.insertInto("discussion")
			.values({
				change_set_id: args.changeSet.id,
			})
			.returningAll()
			.executeTakeFirstOrThrow();

		await trx
			.insertInto("comment")
			.values({
				parent_id: undefined,
				discussion_id: discussion.id,
				body: args.body,
			})
			.execute();

		return discussion;
	});
}
