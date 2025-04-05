// import type { Comment } from "../database/schema.js";
// import { createDiscussion } from "../discussion/create-discussion.js";
import type { Lix } from "../lix/open-lix.js";
import { changeSetElementIsLeafOf } from "../query-filter/change-set-element-is-leaf-of.js";
import { changeSetHasLabel } from "../query-filter/change-set-has-label.js";
import { changeSetIsAncestorOf } from "../query-filter/change-set-is-ancestor-of.js";
import { changeSetIsDescendantOf } from "../query-filter/change-set-is-descendant-of.js";
import type { VersionV2 } from "../version-v2/database-schema.js";
import { createChangeSet } from "./create-change-set.js";
import type { ChangeSet } from "./database-schema.js";

export async function createCheckpoint(args: {
	lix: Lix;
	/**
	 * The comment to add to the checkpoint.
	 *
	 * Use this as "checkpoint message". Modeling the
	 * message as first comment enables re-using the discussion
	 * components.
	 */
	// firstComment?: Pick<Comment, "content">;
	/**
	 * The version for which the checkpoint should be created.
	 *
	 * @default The active version
	 */
	version?: Pick<VersionV2, "id">;
}): Promise<ChangeSet> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const version = args.version
			? await trx
					.selectFrom("version_v2")
					.where("id", "=", args.version.id)
					.select(["id", "change_set_id"])
					.executeTakeFirstOrThrow()
			: await trx
					.selectFrom("active_version")
					.innerJoin("version_v2", "version_v2.id", "active_version.version_id")
					.select(["id", "change_set_id"])
					.executeTakeFirstOrThrow();

		const checkpointLabel = await trx
			.selectFrom("label")
			.where("name", "=", "checkpoint")
			.select("id")
			.executeTakeFirstOrThrow();

		const parentCheckpoint = await trx
			.selectFrom("change_set")
			.where(changeSetHasLabel(checkpointLabel))
			.where(changeSetIsAncestorOf({ id: version.change_set_id }))
			// potential todo: handle multiple checkpoints as parents
			.select(["id"])
			.executeTakeFirst();

		const leafChanges = await trx
			.selectFrom("change_set_element")
			.innerJoin(
				"change_set",
				"change_set.id",
				"change_set_element.change_set_id"
			)
			// get the changes between the last checkpoint and the versions change set
			.where(changeSetIsAncestorOf({ id: version.change_set_id }))
			.$if(parentCheckpoint !== undefined, (eb) =>
				eb.where(changeSetIsDescendantOf(parentCheckpoint!))
			)
			.where(changeSetElementIsLeafOf([{ id: version.change_set_id }]))
			.select(["change_id as id", "entity_id", "schema_key", "file_id"])
			.execute();

		const newChangeSet = await createChangeSet({
			lix: { db: trx },
			changes: leafChanges,
			labels: [checkpointLabel],
			parents: parentCheckpoint
				? [parentCheckpoint, { id: version.change_set_id }]
				: [{ id: version.change_set_id }],
		});

		await trx
			.updateTable("version_v2")
			.set({
				change_set_id: newChangeSet.id,
			})
			.where("id", "=", version.id)
			.execute();

		// // Create a discussion with the provided comment if it exists
		// if (args.firstComment) {
		// 	await createDiscussion({
		// 		lix: { db: trx },
		// 		changeSet: { id: toBeCheckpointedChangeSetId },
		// 		firstComment: args.firstComment,
		// 	});
		// }
		return newChangeSet;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
