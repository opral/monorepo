import { Kysely } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";

export async function createDiscussion(args: {
	db: Kysely<LixDatabaseSchema>;
	currentAuthor: string;
	changeIds?: string[];
	body: string;
}) {
	return args.db.transaction().execute(async (trx) => {
		const changeIds =
			args.changeIds && args.changeIds.length > 0 ? args.changeIds : undefined;

		const discussion = await trx
			.insertInto("discussion")
			.defaultValues()
			.returning("id")
			.executeTakeFirstOrThrow();

		// create mapping from discussion to changes
		if (changeIds) {
			for (const changeId of changeIds ?? []) {
				await trx
					.insertInto("discussion_change_map")
					.values({
						change_id: changeId,
						discussion_id: discussion.id,
					})
					.execute();
			}
		}

		await trx
			.insertInto("comment")
			.values({
				parent_id: undefined,
				discussion_id: discussion.id,
				author_id: args.currentAuthor,
				body: args.body,
			})
			.execute();

		return discussion;
	});
}
