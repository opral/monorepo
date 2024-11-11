import type { Change, ChangeConflict } from "../database/schema.js";
import type { Lix } from "../lix/open-lix.js";
import { applyChanges } from "../plugin/apply-changes.js";

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
			.execute();

		// TODO on-demand apply changes https://linear.app/opral/issue/LIXDK-219/on-demand-applychanges-on-filedata-read
		await applyChanges({
			lix: { ...args.lix, db: trx },
			changes: [args.select],
		});
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	}
	return args.lix.db.transaction().execute(executeInTransaction);
}
