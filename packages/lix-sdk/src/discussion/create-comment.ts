import type { Comment } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";

export async function createComment(args: {
	lix: Pick<Lix, "db">;
	parentComment: Pick<Comment, "id" | "discussion_id">;
	content: string;
}): Promise<Comment> {
	return args.lix.db
		.insertInto("comment")
		.values({
			discussion_id: args.parentComment.discussion_id,
			parent_id: args.parentComment.id,
			content: args.content,
		})
		.returningAll()
		.executeTakeFirstOrThrow();
}
