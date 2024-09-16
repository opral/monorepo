import { Kysely } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import { v4 } from "uuid";

export async function createDiscussion(args: {
	db: Kysely<LixDatabaseSchema>;
	currentAuthor: string;
	changeIds?: string[];
	body: string;
}) {
	const newDiscussionId = v4();
	const newCommentId = v4();

	return args.db.transaction().execute(async (trx) => {
		const changeIds =
			args.changeIds && args.changeIds.length > 0 ? args.changeIds : undefined;
		// verify changes exists
		if (changeIds) {
			console.log("checking changes");
			const { count } = (await trx
				.selectFrom("change")
				.select(trx.fn.countAll().as("count"))
				// NOTE: for high amount of changes this will be extremly costy since its a huge or clause
				.where("change.id", "in", changeIds) // NOTE: this will need to be batched if the amount of changes passed is bigger than sqlite max parameter count
				.executeTakeFirstOrThrow()) as { count: number }; // TODO check if this cast is ok - it coult be a string/bigint or number

			if (count !== changeIds.length) {
				throw new Error("unknown changes passed");
			}
		}

		const discussion = await trx
			.insertInto("discussion")
			.values({
				id: newDiscussionId,
			})
			.returning("id")
			.executeTakeFirstOrThrow();

		// create mapping from discussion to changes
		if (changeIds) {
			for (const changeId of changeIds ?? []) {
				await trx
					.insertInto("discussion_change_map")
					.values({
						change_id: changeId,
						discussion_id: newDiscussionId,
					})
					.executeTakeFirstOrThrow();
			}
		}

		await trx
			.insertInto("comment")
			.values({
				id: newCommentId,
				parent_id: undefined,
				discussion_id: newDiscussionId,
				author_id: args.currentAuthor,
				// todo - use zoned datetime
				body: args.body,
			})
			.executeTakeFirstOrThrow();

		return discussion;
	});
}
