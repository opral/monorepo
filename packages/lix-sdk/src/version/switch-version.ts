import { applyChanges } from "../change/apply-changes.js";
import type { Change, Version } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import { versionChangeInDifference } from "../query-filter/version-change-in-difference.js";

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
		const currentVersion = await trx
			.selectFrom("current_version")
			.selectAll()
			.executeTakeFirstOrThrow();

		await trx.updateTable("current_version").set({ id: args.to.id }).execute();

		const versionChangesDifference = await trx
			.selectFrom("version_change")
			.innerJoin("change", "version_change.change_id", "change.id")
			.where(versionChangeInDifference(currentVersion, args.to))
			.selectAll("change")
			.execute();

		const toBeAppliedChanges: Change[] = [];

		await Promise.all(
			versionChangesDifference.map(async (change) => {
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
					return toBeAppliedChanges.push(existingEntityChange);
				}
				// need to remove the entity when switching the version
				else {
					if (
						change.plugin_key === "lix_own_entity" &&
						(change.schema_key === "lix_account_table" ||
							change.schema_key === "lix_version_table")
					) {
						// deleting accounts and versions when switching is
						// not desired. a version should be able to jump to a
						// different version and the accounts are not affected
						return;
					}
					// the entity does not exist in the switched to version
					return toBeAppliedChanges.push({
						...change,
						snapshot_id: "no-content",
					});
				}
			})
		);

		await applyChanges({
			lix: { ...args.lix, db: trx },
			changes: toBeAppliedChanges,
		});
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
