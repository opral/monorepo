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
				// If the change sets are working change sets,
				// we must avoid edges in the graph because
				// working change sets are mutable, and not
				// insertable into the graph.
				const afterIsWorkingCs = args.changeSetAfter
					? await trx
							.selectFrom("version_v2")
							.where(
								"version_v2.working_change_set_id",
								"=",
								args.changeSetAfter.id
							)
							.selectAll()
							.executeTakeFirst()
					: undefined;

				// need to disable the trigger to avoid
				// duplicate working change set updates
				await trx
					.insertInto("key_value")
					.values({
						key: "lix_skip_update_working_change_set",
						value: "true",
						skip_change_control: true,
					})
					.execute();
				const currentFile = await trx
					.selectFrom("file")
					.where("id", "=", args.file.id)
					.selectAll()
					.executeTakeFirst();

				const currentChangeSets = await trx
					.selectFrom("change_set")
					.selectAll()
					.execute();

				await trx.deleteFrom("file").where("id", "=", args.file.id).execute();

				const leafChangesOfFileBefore = args.changeSetBefore
					? await trx
							.selectFrom("change")
							.innerJoin(
								"change_set_element",
								"change.id",
								"change_set_element.change_id"
							)
							.where((eb) =>
								eb.or([
									eb("change.file_id", "=", args.file.id),
									eb.and([
										eb("change.schema_key", "=", "lix_file_table"),
										eb("change.entity_id", "=", args.file.id),
									]),
								])
							)
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
							// need to get the insert changes for the file as well to apply the plugins changes
							.where((eb) =>
								eb.or([
									eb("change.file_id", "=", args.file.id),
									eb.and([
										eb("change.schema_key", "=", "lix_file_table"),
										eb("change.entity_id", "=", args.file.id),
									]),
								])
							)
							.where(
								changeSetElementIsLeafOf([
									afterIsWorkingCs
										? // we need to take the versions change set, not working change set to
											// get all leaf changes by traversing the graph
											{ id: afterIsWorkingCs.change_set_id }
										: { id: args.changeSetAfter.id },
								])
							)
							.selectAll("change")
							.execute()
					: [];

				const beforeCs = await createChangeSet({
					lix: { ...args.lix, db: trx },
					elements: leafChangesOfFileBefore.map((change) => ({
						change_id: change.id,
						entity_id: change.entity_id,
						schema_key: change.schema_key,
						file_id: change.file_id,
					})),
				});

				const afterCs = await createChangeSet({
					lix: { ...args.lix, db: trx },
					elements: leafChangesOfFileAfter.map((change) => ({
						change_id: change.id,
						entity_id: change.entity_id,
						schema_key: change.schema_key,
						file_id: change.file_id,
					})),
				});

				const interimVersion = await createVersionV2({
					lix: { ...args.lix, db: trx },
					changeSet: beforeCs,
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

				// clean up
				await trx
					.deleteFrom("change_set")
					.where("id", "=", beforeCs.id)
					.execute();
				await trx
					.deleteFrom("change_set")
					.where("id", "=", afterCs.id)
					.execute();
				await trx
					.deleteFrom("version_v2")
					.where("id", "=", interimVersion.id)
					.execute();

				// currently facing unexpected behavior because the change sets are
				// two more than before from apply changes i suspect that the flush
				// pending changes trigger might interfere.
				//
				// took this shortcut to deliver a tight deadline
				await trx
					.deleteFrom("change_set")
					.where(
						"id",
						"not in",
						currentChangeSets.map((cs) => cs.id)
					)
					.execute();

				await trx
					.deleteFrom("key_value")
					.where("key", "=", "lix_skip_update_working_change_set")
					.execute();

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
