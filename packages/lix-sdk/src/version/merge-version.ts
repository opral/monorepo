import { createChangeConflict } from "../change-conflict/create-change-conflict.js";
import { detectChangeConflicts } from "../change-conflict/detect-change-conflicts.js";
import { changeSetElementInSymmetricDifference } from "../change-set/change-set-element-in-symmetric-difference.js";
import type { Version } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import { changeInVersion } from "../query-filter/change-in-version.js";

export async function mergeVersion(args: {
	lix: Lix;
	sourceVersion: Version;
	targetVersion: Version;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const sourceChangeSet = { id: args.sourceVersion.change_set_id };
		const targetChangeSet = { id: args.targetVersion.change_set_id };

		const symmetricDifference = await trx
			.selectFrom("change")
			.innerJoin(
				"change_set_element",
				"change.id",
				"change_set_element.change_id",
			)
			.where(
				changeSetElementInSymmetricDifference(sourceChangeSet, targetChangeSet),
			)
			.selectAll("change")
			.select("change_set_element.change_set_id")
			.execute();

		const detectedConflicts = await detectChangeConflicts({
			lix: { ...args.lix, db: trx },
			changes: symmetricDifference,
		});

		for (const change of symmetricDifference) {
			// we can ignore the changes that are in target as they are already there
			if (change.change_set_id === targetChangeSet.id) {
				continue;
			}

			const hasConflict = detectedConflicts.find((conflict) =>
				conflict.conflictingChangeIds.has(change.id),
			);

			const existingChangePointer = await trx
				.selectFrom("change")
				.where("file_id", "=", change.file_id)
				.where("entity_id", "=", change.entity_id)
				.where("schema_key", "=", change.schema_key)
				.where(changeInVersion(args.targetVersion))
				.select("id")
				.executeTakeFirst();

			// shouldn't update the pointer if there is a conflict
			// and the change pointer already exists
			if (hasConflict && existingChangePointer) {
				continue;
			}

			if (existingChangePointer) {
				// update the existing change pointer
				await trx
					.updateTable("change_set_element")
					.set({
						change_id: change.id,
					})
					.where("change_id", "=", existingChangePointer.id)
					.execute();
			} else {
				// insert the new change pointer
				await trx
					.insertInto("change_set_element")
					.values({
						change_set_id: args.targetVersion.change_set_id,
						change_id: change.id,
					})
					.execute();
			}
		}

		// insert the detected conflicts
		// (ignore if the conflict already exists)
		for (const detectedConflict of detectedConflicts) {
			await createChangeConflict({
				lix: { ...args.lix, db: trx },
				version: args.targetVersion,
				key: detectedConflict.key,
				conflictingChangeIds: detectedConflict.conflictingChangeIds,
			});
		}
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
