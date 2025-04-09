import { withSkipFileQueue } from "../file-queue/with-skip-file-queue.js";
import type { Lix } from "../lix/index.js";
import { withSkipOwnChangeControl } from "../own-change-control/with-skip-own-change-control.js";
import { changeSetElementInAncestryOf } from "../query-filter/change-set-element-in-ancestry-of.js";
import { changeSetElementIsLeafOf } from "../query-filter/change-set-element-is-leaf-of.js";
import { createVersionV2 } from "../version-v2/create-version.js";
import type { VersionV2 } from "../version-v2/database-schema.js";
import { applyChangeSet } from "./apply-change-set.js";
import { createChangeSet } from "./create-change-set.js";
import type { ChangeSet } from "./database-schema.js";
/**
 * Checks out a specific change set.
 * 
 * Useful for diffing between states, e.g., comparing state A to state B.
 *
 * INFO: THIS IS AN INTERIM API UNTIL https://github.com/opral/lix-sdk/issues/252 lands. 
 */
export async function checkoutChangeSet(args: {
	lix: Lix;
	changeSet: Pick<ChangeSet, "id">;
}): Promise<VersionV2> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const leafElements = await trx
			.selectFrom("change_set_element")
			.innerJoin("change", "change.id", "change_set_element.change_id")
			.where(changeSetElementIsLeafOf([args.changeSet]))
			.where(changeSetElementInAncestryOf([args.changeSet]))
			.selectAll("change")
			.execute();

		const interimCheckoutChangeSet = await createChangeSet({
			lix: { ...args.lix, db: trx },
			changes: leafElements,
		});

		const checkoutVersion = await createVersionV2({
			lix: { ...args.lix, db: trx },
			changeSet: args.changeSet,
			name: null,
		});

		// TODO #3558 we should have one "withSkipChangeControl" that handles both
		// it requires deeper knowledge to know that both are needed to "fully"
		// skip change control
		await withSkipFileQueue(trx, async (trx) => {
			await withSkipOwnChangeControl(trx, async (trx) => {
				// TODO heursitic to wipe out all files. Better to use `createRestoreChangeSet()`
				// under the hood for checkout.
				await trx.deleteFrom("file").execute();

				await applyChangeSet({
					lix: { ...args.lix, db: trx },
					changeSet: interimCheckoutChangeSet,
					version: checkoutVersion,
				});

				await trx
					.updateTable("version_v2")
					.set({
						change_set_id: args.changeSet.id,
					})
					.where("version_v2.id", "=", checkoutVersion.id)
					.execute();
			});
		});

		return checkoutVersion;
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
