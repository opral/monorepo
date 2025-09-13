import type { Lix } from "../lix/open-lix.js";
import type { LixThread, LixThreadComment } from "./schema.js";
import { nanoId } from "../engine/deterministic/nano-id.js";
import type { NewState } from "../entity-views/types.js";
import type { LixEntity, LixEntityCanonical } from "../entity/schema.js";
import { createEntityThread } from "../entity/thread/create-entity-thread.js";

/**
 * Starts a new discussion thread.
 *
 * Threads allow collaborators to attach comments to a specific
 * version or entity. Initial comments can be provided and will be
 * inserted sequentially.
 *
 * @example
 * ```ts
 * // Create a standalone thread
 * const thread = await createThread({ lix, comments: [{ body: "Hello" }] })
 * ```
 *
 * @example
 * ```ts
 * // Create a thread attached to an entity
 * const thread = await createThread({
 *   lix,
 *   entity: { entity_id: "para_123", schema_key: "markdown_paragraph", file_id: "README.md" },
 *   comments: [{ body: "This paragraph needs review" }]
 * })
 * ```
 */

export async function createThread(args: {
	lix: Lix;
	id?: string;
	comments?: Pick<NewState<LixThreadComment>, "body">[];
	/** defaults to global */
	versionId?: string;
	/** Optional entity to attach the thread to */
	entity?: LixEntity | LixEntityCanonical;
}): Promise<
	LixThread & {
		lixcol_version_id: string;
		comments: (LixThreadComment & {
			lixcol_version_id: string;
		})[];
	}
> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const threadId =
			args.id ?? (await nanoId({ lix: { ...args.lix, db: trx } }));
		const versionId = args.versionId ?? "global";

		await trx
			.insertInto("thread_all")
			.values({ id: threadId, lixcol_version_id: versionId })
			.execute();

		const thread = await trx
			.selectFrom("thread_all")
			.selectAll()
			.where("id", "=", threadId)
			.where("lixcol_version_id", "=", versionId)
			.executeTakeFirstOrThrow();

		const insertedComments = [];

		for (const [index, comment] of (args.comments ?? []).entries()) {
			const commentId = await nanoId({ lix: { ...args.lix, db: trx } });

			await trx
				.insertInto("thread_comment_all")
				.values({
					id: commentId,
					thread_id: thread.id,
					body: comment.body,
					parent_id: index > 0 ? insertedComments[index - 1]!.id : null,
					lixcol_version_id: versionId,
				})
				.execute();

			const insertedComment = await trx
				.selectFrom("thread_comment_all")
				.selectAll()
				.where("id", "=", commentId)
				.where("lixcol_version_id", "=", versionId)
				.executeTakeFirstOrThrow();

			insertedComments.push(insertedComment);
		}

		// If an entity is provided, create the entity-thread mapping
		if (args.entity) {
			await createEntityThread({
				lix: { db: trx },
				entity: args.entity,
				thread: { id: threadId },
				versionId: versionId,
			});
		}

		return { ...thread, comments: insertedComments };
	};

	if (args.lix.db.isTransaction) {
		return await executeInTransaction(args.lix.db);
	} else {
		return await args.lix.db.transaction().execute(executeInTransaction);
	}
}
