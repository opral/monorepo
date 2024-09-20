import { Kysely } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import { v4 } from "uuid";

export async function addComment(args: {
	db: Kysely<LixDatabaseSchema>;
	currentAuthor: string;
	parentCommentId: string;
	body: string;
}) {
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
				author_id: args.currentAuthor,
				body: args.body,
			})
			.returning("id")
			.executeTakeFirstOrThrow();

		return comment;
	});
}
