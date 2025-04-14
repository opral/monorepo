import type { Lix } from "../lix/open-lix.js";
import { applyChangeSet } from "../change-set/apply-change-set.js";
import { withSkipFileQueue } from "../file-queue/with-skip-file-queue.js";
import { withSkipOwnChangeControl } from "../own-change-control/with-skip-own-change-control.js";
import type { VersionV2 } from "./database-schema.js";
import { createTransitionChangeSet } from "../change-set/create-transition-change-set.js";
import { sql } from "kysely";

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
export async function switchVersionV2(args: {
	lix: Lix;
	to: Pick<VersionV2, "id">;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		return await withSkipOwnChangeControl(trx, async (trx) => {
			return await withSkipFileQueue(trx, async (trx) => {
				const activeVersion = await trx
					.selectFrom("active_version")
					.innerJoin("version_v2", "active_version.version_id", "version_v2.id")
					.selectAll("version_v2")
					.executeTakeFirstOrThrow();

				const targetVersion = await trx
					.selectFrom("version_v2")
					.where("id", "=", args.to.id)
					.selectAll()
					.executeTakeFirstOrThrow();

				await trx
					.insertInto("key_value")
					.values({ key: "lix_skip_update_working_change_set", value: "true" })
					.execute();

				console.log(`Switching from Version ID: ${activeVersion.id} to Target Version ID: ${targetVersion.id}`);

				const transitionChangeSet = await createTransitionChangeSet({
					lix: { ...args.lix, db: trx },
					sourceChangeSet: { id: activeVersion.change_set_id },
					targetChangeSet: { id: targetVersion.change_set_id },
				});

				console.log(`Applying transition change set ${transitionChangeSet.id}`);
				await applyChangeSet({
					lix: { ...args.lix, db: trx },
					changeSet: transitionChangeSet,
					updateVersion: false,
				});

				// Update the active version pointer MANUALLY
				console.log(`Updating active_version.version_id to: ${targetVersion.id}`);
				await trx
					.updateTable("active_version")
					.set({ version_id: targetVersion.id })
					.executeTakeFirstOrThrow();

				// Check for foreign key violations before committing
				const fkErrorsAfterUpdate = await sql`PRAGMA foreign_key_check`.execute(trx);
				if (Array.isArray(fkErrorsAfterUpdate.rows) && fkErrorsAfterUpdate.rows.length > 0) {
					console.error(
						"FOREIGN KEY VIOLATIONS DETECTED (after active_version update):",
						fkErrorsAfterUpdate.rows
					);
				} else {
					console.log("No FK violations detected after active_version update.");
				}

				// Clean up the temporary skip flag
				await trx
					.deleteFrom("key_value")
					.where("key", "=", "lix_skip_update_working_change_set")
					.execute();

				// Check for foreign key violations before committing
				const fkErrors = await sql`PRAGMA foreign_key_check`.execute(trx);
				if (Array.isArray(fkErrors.rows) && fkErrors.rows.length > 0) {
					console.error("FOREIGN KEY VIOLATIONS DETECTED:", fkErrors.rows);
				}
			});
		});
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
