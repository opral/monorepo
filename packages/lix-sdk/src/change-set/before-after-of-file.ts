import type { LixFile } from "../database/schema.js";
import { withSkipFileQueue } from "../file-queue/with-skip-file-queue.js";
import type { Lix } from "../lix/open-lix.js";
import { withSkipOwnChangeControl } from "../own-change-control/with-skip-own-change-control.js";
import { changeSetElementIsLeafOf } from "../query-filter/change-set-element-is-leaf-of.js";
import { createVersionV2 } from "../version-v2/create-version.js";
import { applyChangeSet } from "./apply-change-set.js";
import { createChangeSet } from "./create-change-set.js";
import type { ChangeSet } from "./database-schema.js";

/**
 * Interim utility function until https://github.com/opral/lix-sdk/issues/252 arrives.
 *
 * Use this function to get the file contents before and after for diffing purposes.
 *
 * @example
 *   const { before, after } = await diffForFile({
 *     lix,
 *     changeSetBefore,
 *     changeSetAfter,
 *     file: { id: "XYZ" },
 *   });
 *
 *   console.log("Before:", before);
 *   console.log("After:", after);
 *
 *   renderDiff(before, after);
 */
export async function beforeAfterOfFile(args: {
	lix: Lix;
	changeSetBefore?: Pick<ChangeSet, "id">;
	changeSetAfter?: Pick<ChangeSet, "id">;
	file: Pick<LixFile, "id">;
}): Promise<{ before?: LixFile; after?: LixFile }> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		// TODO #3558 we should have one "withSkipChangeControl" that handles both
		// it requires deeper knowledge to know that both are needed to "fully" skip change control
		return await withSkipFileQueue(trx, async (trx) => {
			return await withSkipOwnChangeControl(trx, async (trx) => {
				const currentFile = await trx
					.selectFrom("file")
					.where("id", "=", args.file.id)
					.selectAll()
					.executeTakeFirst();

				await trx.deleteFrom("file").where("id", "=", args.file.id).execute();

				const leafChangesOfFileBefore = args.changeSetBefore
					? await trx
							.selectFrom("change")
							.innerJoin(
								"change_set_element",
								"change.id",
								"change_set_element.change_id"
							)
							.where("change.file_id", "=", args.file.id)
							.where(changeSetElementIsLeafOf([args.changeSetBefore]))
							.selectAll("change")
							.execute()
					: [];

				const leafChangesOfFileAfter = args.changeSetAfter
					? await trx
							.selectFrom("change")
							.innerJoin(
								"change_set_element",
								"change.id",
								"change_set_element.change_id"
							)
							.where("change.file_id", "=", args.file.id)
							.where(changeSetElementIsLeafOf([args.changeSetAfter]))
							.selectAll("change")
							.execute()
					: [];

				const beforeCs = await createChangeSet({
					lix: { ...args.lix, db: trx },
					changes: leafChangesOfFileBefore,
					parents: args.changeSetBefore
						? [{ id: args.changeSetBefore.id }]
						: undefined,
				});

				const afterCs = await createChangeSet({
					lix: { ...args.lix, db: trx },
					changes: leafChangesOfFileAfter,
					parents: args.changeSetAfter
						? [{ id: args.changeSetAfter.id }]
						: undefined,
				});

				const interimVersion = await createVersionV2({
					lix: { ...args.lix, db: trx },
					from: beforeCs,
					name: null,
				});

				await applyChangeSet({
					lix: { ...args.lix, db: trx },
					changeSet: beforeCs,
					version: interimVersion,
				});

				const fileBefore = await trx
					.selectFrom("file")
					.where("id", "=", args.file.id)
					.selectAll()
					.executeTakeFirst();

				await trx.deleteFrom("file").where("id", "=", args.file.id).execute();

				await applyChangeSet({
					lix: { ...args.lix, db: trx },
					changeSet: afterCs,
					version: interimVersion,
				});

				const fileAfter = await trx
					.selectFrom("file")
					.where("id", "=", args.file.id)
					.selectAll()
					.executeTakeFirst();

				// restore the original file
				if (currentFile) {
					await trx
						.updateTable("file")
						.set(currentFile)
						.where("id", "=", args.file.id)
						.execute();
				}

				return { before: fileBefore, after: fileAfter };
			});
		});
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
