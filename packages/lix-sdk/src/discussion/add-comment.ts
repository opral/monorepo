import { Kysely } from "kysely";
import type { Comment, LixDatabaseSchema } from "../database/schema.js";

export async function addComment(args: {
	db: Kysely<LixDatabaseSchema>;
	parentCommentId: string;
	body: string;
}): Promise<{ id: Comment["id"] }> {
	return args.db.transaction().execute(async (trx) => {
		// verify that the parent comment exists and fetch the discussion_id
		const { discussion_id } = await trx
			.selectFrom("comment")
			.select("discussion_id")
			.where("id", "=", args.parentCommentId)
			.executeTakeFirstOrThrow();

		const comment = await trx
			.insertInto("comment")
			.values({
				parent_id: args.parentCommentId,
				discussion_id,
				body: args.body,
			})
			.returning("id")
			.executeTakeFirstOrThrow();

		return comment;
	});
}
