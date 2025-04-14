import { withSkipFileQueue } from "../file-queue/with-skip-file-queue.js";
import { applyChanges } from "../change/apply-changes.js";
import type { Change, Version } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import { versionChangeInSymmetricDifference } from "../query-filter/version-change-in-symmetric-difference.js";

/**
 * Switches the current Version to the given Version.
 *
 * The Version must already exist before calling this function.
 *
 * @example
 *   ```ts
 *   await switchVersion({ lix, to: otherVersion });
 *   ```
 *
 * @example
 *   Switching Versiones to a newly created Version.
 *
 *   ```ts
 *   await lix.db.transaction().execute(async (trx) => {
 *      const newVersion = await createVersion({ lix: { db: trx }, parent: currentVersion });
 *      await switchVersion({ lix: { db: trx }, to: newVersion });
 *   });
 *   ```
 */
export async function switchVersion(args: {
	lix: Pick<Lix, "db" | "plugin">;
	to: Pick<Version, "id">;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		await withSkipFileQueue(trx, async (trx) => {
			const sourceVersion = await trx
				.selectFrom("current_version")
				.selectAll()
				.executeTakeFirstOrThrow();

			await trx
				.updateTable("current_version")
				.set({ id: args.to.id })
				.execute();

			// need symmetric difference to detect inserts and deletions
			// that should occur when switching the version
			const versionChangesSymmetricDifference = await trx
				.selectFrom("version_change")
				.innerJoin("change", "version_change.change_id", "change.id")
				.where(versionChangeInSymmetricDifference(sourceVersion, args.to))
				.selectAll("change")
				.execute();

			// because we use the symmetric difference, entity
			// changes need to be de-duplicated. in the future,
			// we could improve the symmetric difference query
			const toBeAppliedChanges: Map<string, Change> = new Map();

			for (const change of versionChangesSymmetricDifference) {
				const existingEntityChange = await trx
					.selectFrom("version_change")
					.innerJoin("change", "change.id", "version_change.change_id")
					.where("version_id", "=", args.to.id)
					.where("change.entity_id", "=", change.entity_id)
					.where("change.file_id", "=", change.file_id)
					.where("change.schema_key", "=", change.schema_key)
					.selectAll("change")
					.executeTakeFirst();

				if (existingEntityChange) {
					toBeAppliedChanges.set(
						`${change.file_id},${change.entity_id},${change.schema_key}`,
						existingEntityChange
					);
					continue;
				}
				// need to remove the entity when switching the version
				else {
					thi
					// the entity does not exist in the switched to version
					toBeAppliedChanges.set(
						`${change.file_id},${change.entity_id},${change.schema_key}`,
						{
							...change,
							snapshot_id: "no-content",
						}
					);
				}
			}

			return await applyChanges({
				lix: { ...args.lix, db: trx },
				changes: toBeAppliedChanges.values().toArray(),
			});
		});
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
