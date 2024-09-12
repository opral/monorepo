import { Kysely } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import { v4 } from "uuid";

export async function comment(args: {
	db: Kysely<LixDatabaseSchema>;
	currentAuthor: string;
	parentComment: { id: string };
	body: string;
}) {
	const newCommentId = v4();

	return args.db.transaction().execute(async (trx) => {
		// verify that the parent comment exists and fetch the discussion_id
		const { discussion_id } = await trx
			.selectFrom("comment")
			.select("discussion_id")
			.where("id", "=", args.parentComment.id)
			.executeTakeFirstOrThrow();

		const comment = await trx
			.insertInto("comment")
			.values({
				id: newCommentId,
				parent_id: args.parentComment.id,
				discussion_id,
				author_id: args.currentAuthor,
				// todo - use zoned datetime
				body: args.body,
			})
			.returning("id")
			.executeTakeFirstOrThrow();

		return comment;
	});
}
