import type { Change, ChangeConflict } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import { applyChanges } from "../plugin/apply-changes.js";
import { updateChangesInVersion } from "../version/update-changes-in-version.js";

/**
 * Resolves a conflict by selecting one of the two
 * changes in the conflict.
 */
export async function resolveChangeConflictBySelecting(args: {
	lix: Lix;
	conflict: ChangeConflict;
	select: Change;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		await trx
			.insertInto("change_conflict_resolution")
			.values({
				change_conflict_id: args.conflict.id,
				resolved_change_id: args.select.id,
			})
			// conflict resolution already exists
			.onConflict((oc) => oc.doNothing())
			.execute();

		// TODO on-demand apply changes https://linear.app/opral/issue/LIXDK-219/on-demand-applychanges-on-filedata-read
		await applyChanges({
			lix: { ...args.lix, db: trx },
			changes: [args.select],
		});

		const versionsWithConflicts = await trx
			.selectFrom("version")
			.innerJoin(
				"version_change_conflict",
				"version_change_conflict.version_id",
				"version.id",
			)
			.where(
				"version_change_conflict.change_conflict_id",
				"=",
				args.conflict.id,
			)
			.selectAll()
			.execute();

		for (const version of versionsWithConflicts) {
			await updateChangesInVersion({
				lix: { ...args.lix, db: trx },
				changes: [args.select],
				version,
			});
			// remove the conflict pointer
			await trx
				.deleteFrom("version_change_conflict")
				.where("version_id", "=", version.id)
				.where("change_conflict_id", "=", args.conflict.id)
				.execute();
		}
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	}
	return args.lix.db.transaction().execute(executeInTransaction);
}
