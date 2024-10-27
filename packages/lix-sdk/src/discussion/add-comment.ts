import type { Comment } from "../database/schema.js";
import type { Lix } from "../types.js";

export async function addComment(args: {
	lix: Partial<Lix> & { db: { transaction: Lix["db"]["transaction"] } };
	parentComment: Partial<Comment> & {
		id: Comment["id"];
		discussion_id: Comment["discussion_id"];
	};
	body: string;
}): Promise<Comment> {
	return args.lix.db
		.insertInto("comment")
		.values({
			discussion_id: args.parentComment.discussion_id,
			parent_id: args.parentComment.id,
			body: args.body,
		})
		.returningAll()
		.executeTakeFirstOrThrow();
}
