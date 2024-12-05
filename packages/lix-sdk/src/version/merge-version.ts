import { createChangeConflict } from "../change-conflict/create-change-conflict.js";
import { detectChangeConflicts } from "../change-conflict/detect-change-conflicts.js";
import type { Version } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import { versionChangeInSymmetricDifference } from "../query-filter/version-change-in-symmetric-difference.js";

export async function mergeVersion(args: {
	lix: Lix;
	sourceVersion: Version;
	targetVersion: Version;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const symmetricDifference = await trx
			.selectFrom("change")
			.innerJoin("version_change", "change.id", "version_change.change_id")
			.where(
				versionChangeInSymmetricDifference(
					args.sourceVersion,
					args.targetVersion
				)
			)
			.selectAll("change")
			.execute();

		const detectedConflicts = await detectChangeConflicts({
			lix: { ...args.lix, db: trx },
			changes: symmetricDifference,
		});

		for (const change of symmetricDifference) {
			const hasConflict = detectedConflicts.find((conflict) =>
				conflict.conflictingChangeIds.has(change.id)
			);

			const existingTargetChange = await trx
				.selectFrom("change")
				.innerJoin("version_change", "change.id", "version_change.change_id")
				.where("version_change.version_id", "=", args.targetVersion.id)
				.where("file_id", "=", change.file_id)
				.where("entity_id", "=", change.entity_id)
				.where("schema_key", "=", change.schema_key)
				.select("id")
				.executeTakeFirst();

			// shouldn't update the pointer if there is a conflict
			// and the change pointer already exists
			if (hasConflict && existingTargetChange) {
				continue;
			}

			if (existingTargetChange) {
				// update the existing change pointer
				await trx
					.updateTable("version_change")
					.set({
						change_id: change.id,
					})
					.where("change_id", "=", existingTargetChange.id)
					.where("version_id", "=", args.targetVersion.id)
					.execute();
			} else {
				// insert the new change pointer
				await trx
					.insertInto("version_change")
					.values({
						version_id: args.targetVersion.id,
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
