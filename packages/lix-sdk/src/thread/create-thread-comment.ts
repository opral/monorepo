import type { Lix } from "../lix/open-lix.js";
import { nanoid } from "../database/nano-id.js";
import type { NewState, State } from "../entity-views/generic-types.js";
import type { ThreadComment } from "./schema.js";

export async function createThreadComment(
	args: { lix: Lix } & NewState<ThreadComment>
): Promise<State<ThreadComment>> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const commentId = args.id ?? nanoid();

		const existingThread = await trx
			.selectFrom("thread_all")
			.where("id", "=", args.thread_id)
			// get the root thread version
			.where("lixcol_inherited_from_version_id", "is", null)
			.select("lixcol_version_id")
			.executeTakeFirstOrThrow();

		await trx
			.insertInto("thread_comment_all")
			.values({
				id: commentId,
				thread_id: args.thread_id,
				body: args.body,
				parent_id: args.parent_id,
				lixcol_version_id: existingThread.lixcol_version_id,
			})
			.execute();

		return await trx
			.selectFrom("thread_comment_all")
			.selectAll()
			.where("id", "=", commentId)
			.where("lixcol_version_id", "=", existingThread.lixcol_version_id)
			.executeTakeFirstOrThrow();
	};

	if (args.lix.db.isTransaction) {
		return await executeInTransaction(args.lix.db);
	} else {
		return await args.lix.db.transaction().execute(executeInTransaction);
	}
}
