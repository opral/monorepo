import { createChangeConflict } from "../change-conflict/create-change-conflict.js";
import { detectChangeConflicts } from "../change-conflict/detect-change-conflicts.js";
import { applyChanges } from "../change/apply-changes.js";
import type { Version, VersionChange } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import { versionChangeInSymmetricDifference } from "../query-filter/version-change-in-symmetric-difference.js";

/**
 * @deprecated Use `createMergeChangeSet()` instead.
 */
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

			const versionChange: VersionChange = {
				version_id: args.targetVersion.id,
				change_id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				file_id: change.file_id,
			};

			const existingTargetVersionChange = await trx
				.selectFrom("version_change")
				.where("version_change.version_id", "=", args.targetVersion.id)
				.where("file_id", "=", change.file_id)
				.where("entity_id", "=", change.entity_id)
				.where("schema_key", "=", change.schema_key)
				.select("change_id")
				.executeTakeFirst();

			// shouldn't update the pointer if there is a conflict
			// and the change pointer already exists
			if (hasConflict && existingTargetVersionChange) {
				continue;
			}

			await trx
				.insertInto("version_change")
				.values(versionChange)
				.onConflict((oc) => oc.doUpdateSet(versionChange))
				.execute();
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

		await applyChanges({
			lix: { ...args.lix, db: trx },
			changes: symmetricDifference,
		});
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
