import type { Lix } from "../lix/open-lix.js";
import { nanoId } from "../deterministic/index.js";
import type { NewState, State } from "../entity-views/types.js";
import type { LixThreadComment } from "./schema.js";

/**
 * Adds a comment to an existing thread.
 *
 * The comment inherits the version context from the thread and can
 * be nested by supplying a parent id.
 *
 * @example
 * ```ts
 * await createThreadComment({ lix, thread_id, body: "Thanks" })
 * ```
 */

export async function createThreadComment(
	args: { lix: Lix } & NewState<LixThreadComment>
): Promise<State<LixThreadComment>> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const commentId = args.id ?? nanoId({ lix: args.lix });

		const existingThread = await trx
			.selectFrom("thread_all")
			.where("id", "=", args.thread_id)
			// get the root thread version
			.where("lixcol_inherited_from_version_id", "is", null)
			.select("lixcol_version_id")
			.executeTakeFirstOrThrow();

		// If parent_id is not provided, find the most appropriate parent comment
		// Following common UI patterns (GitHub, Slack), we default to the most recently
		// created leaf comment, which approximates "most recently active" thread
		let parentId = args.parent_id;
		if (parentId === undefined) {
			// Find all leaf comments (comments with no children)
			const leafComment = await trx
				.selectFrom("thread_comment_all as c1")
				.where("c1.thread_id", "=", args.thread_id)
				.where("c1.lixcol_version_id", "=", existingThread.lixcol_version_id)
				.where((eb) =>
					eb.not(
						eb.exists(
							eb
								.selectFrom("thread_comment_all as c2")
								.where("c2.thread_id", "=", args.thread_id)
								.where(
									"c2.lixcol_version_id",
									"=",
									existingThread.lixcol_version_id
								)
								.whereRef("c2.parent_id", "=", "c1.id")
								.select("c2.id")
						)
					)
				)
				.select(["c1.id", "c1.lixcol_created_at"])
				// Select the most recently created leaf (approximates most recent activity)
				.orderBy("c1.lixcol_created_at", "desc")
				.orderBy("c1.id", "desc") // Secondary order by id for absolute determinism
				.executeTakeFirst();
			parentId = leafComment?.id ?? null;
		}

		await trx
			.insertInto("thread_comment_all")
			.values({
				id: commentId,
				thread_id: args.thread_id,
				body: args.body,
				metadata: (args as any).metadata ?? null,
				parent_id: parentId,
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
