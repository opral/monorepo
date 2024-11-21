import type { Account } from "../account/database-schema.js";
import type { Comment } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

export async function createComment(args: {
	lix: Pick<Lix, "db">;
	parentComment: Pick<Comment, "id" | "discussion_id">;
	content: string;
	createdBy: Pick<Account, "id">;
}): Promise<Comment> {
	return args.lix.db
		.insertInto("comment")
		.values({
			discussion_id: args.parentComment.discussion_id,
			parent_id: args.parentComment.id,
			content: args.content,
			created_by: args.createdBy.id,
		})
		.returningAll()
		.executeTakeFirstOrThrow();
}
