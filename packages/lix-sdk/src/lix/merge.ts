import type { Lix } from "./open-lix.js";
import { getLeafChangesOnlyInSource } from "./merge.get-leaf-changes-only-in-source.js";
import { withSkipChangeQueue } from "../change-queue/with-skip-change-queue.js";
import type { DetectedConflict } from "../plugin/lix-plugin.js";

/**
 * Combined the changes of the source lix into the target lix.
 */
export async function merge(args: {
	targetLix: Lix;
	sourceLix: Lix;
	// TODO selectively merge changes
	// onlyTheseChanges
}): Promise<void> {
	// TODO increase performance by using attach mode
	//      and only get the changes that are not in target.
	const sourceChangesWithSnapshot = await args.sourceLix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll("change")
		.select("snapshot.content")
		.execute();

	// TODO don't query the changes again. inefficient.
	const leafChangesOnlyInSource = await getLeafChangesOnlyInSource({
		sourceLix: args.sourceLix,
		targetLix: args.targetLix,
	});

	// 2. Let the plugin detect conflicts

	const plugins = await args.sourceLix.plugin.getAll();
	const plugin = plugins[0];

	// TODO function assumes that all changes belong to the same file
	if (plugins.length > 1) {
		throw new Error("Unimplemented. Only one plugin is supported for now");
	}

	const conflicts: DetectedConflict[] =
		// (await plugin?.detectConflicts?.({
		// 	sourceLix: args.sourceLix,
		// 	targetLix: args.targetLix,
		// })) ??

		[];

	const changesPerFile: Record<string, ArrayBuffer> = {};

	const fileIds = new Set(sourceChangesWithSnapshot.map((c) => c.file_id));

	for (const fileId of fileIds) {
		// 3. apply non conflicting leaf changes
		// TODO inefficient double looping
		const nonConflictingLeafChangesInSourceForFile = leafChangesOnlyInSource
			.filter((sourceChange) =>
				conflicts.every(
					(conflict) =>
						conflict.conflictingChangeIds.has(sourceChange.id) === false,
				),
			)
			.filter((c) => c.file_id === fileId);

		let file = await args.targetLix.db
			.selectFrom("file")
			.selectAll()
			.where("id", "=", fileId)
			.executeTakeFirst();

		// If the file does not exist in the target lix - we just copy the whole file over
		if (!file) {
			file = await args.sourceLix.db
				.selectFrom("file")
				.selectAll()
				.where("id", "=", fileId)
				.executeTakeFirst();

			if (file) {
				const fileToInsert = {
					id: file.id,
					path: file.path,
					data: file.data,
					metadata: file.metadata,
				};

				await withSkipChangeQueue(args.targetLix.db, async (trx) => {
					await trx
						.insertInto("file")
						.values({ ...fileToInsert })
						.executeTakeFirst();
				});
			}
		}

		if (!plugin?.applyChanges) {
			throw new Error("Plugin does not support applying changes");
		}

		const { fileData } = await plugin.applyChanges({
			changes: nonConflictingLeafChangesInSourceForFile,
			// @ts-expect-error - TODO apply changes can be an undefined file
			file,
			lix: args.targetLix,
		});

		changesPerFile[fileId] = fileData;
	}

	// DISCUSSIONS

	/**
	 * NOTE:
	 * this is a naiv implementation that selects just all discussions
	 * and passes them to the target
	 **/
	// selecting all discussion related entries for later upsert
	const sourceDiscussions = await args.sourceLix.db
		.selectFrom("discussion")
		.selectAll()
		.execute();

	const sourceComments = await args.sourceLix.db
		.selectFrom("comment")
		.selectAll()
		.execute();

	// change graph

	const sourceEdges = await args.sourceLix.db
		.selectFrom("change_edge")
		.selectAll()
		.execute();

	// change sets

	const sourceChangeSets = await args.sourceLix.db
		.selectFrom("change_set")
		.selectAll()
		.execute();

	const sourceChangeSetItems = await args.sourceLix.db
		.selectFrom("change_set_element")
		.selectAll()
		.execute();

	await args.targetLix.db.transaction().execute(async (trx) => {
		if (sourceChangesWithSnapshot.length > 0) {
			// copy the snapshots from source
			await trx
				.insertInto("snapshot")
				.values(
					// https://github.com/opral/inlang-message-sdk/issues/123
					sourceChangesWithSnapshot.map((change) => ({
						content: JSON.stringify(change.content),
					})),
				)
				// ignore if already exists
				.onConflict((oc) => oc.doNothing())
				.execute();

			await trx
				.insertInto("change")
				.values(
					sourceChangesWithSnapshot.map((c) => ({
						...c,
						content: undefined,
					})),
				)
				// ignore if already exists
				.onConflict((oc) => oc.doNothing())
				.execute();
		}

		// insert the conflicts of those changes
		if (conflicts.length > 0) {
			// await trx
			// 	.insertInto("conflict")
			// 	.values(conflicts)
			// 	// ignore if already exists
			// 	.onConflict((oc) => oc.doNothing())
			// 	.execute();
		}

		for (const [fileId, fileData] of Object.entries(changesPerFile)) {
			// update the file data with the applied changes
			await withSkipChangeQueue(trx, async (trx) => {
				await trx
					.updateTable("file")
					.set("data", fileData)
					.where("id", "=", fileId)
					.execute();
			});
		}

		// copy edges
		if (sourceEdges.length > 0) {
			await trx
				.insertInto("change_edge")
				.values(sourceEdges)
				// ignore if already exists
				.onConflict((oc) => oc.doNothing())
				.execute();
		}

		// add change sets and change_set_memberships
		if (sourceChangeSets.length > 0) {
			await trx
				.insertInto("change_set")
				.values(sourceChangeSets)
				// ignore if already exists
				.onConflict((oc) => oc.doNothing())
				.execute();
		}
		if (sourceChangeSetItems.length > 0) {
			await trx
				.insertInto("change_set_element")
				.values(sourceChangeSetItems)
				// ignore if already exists
				.onConflict((oc) => oc.doNothing())
				.execute();
		}

		// add discussions, comments and discsussion_change_mappings

		if (sourceDiscussions.length > 0) {
			await trx
				.insertInto("discussion")
				.values(sourceDiscussions)
				// ignore if already exists
				.onConflict((oc) => oc.doNothing())
				.execute();
		}

		if (sourceComments.length > 0) {
			await trx
				.insertInto("comment")
				.values(sourceComments)
				// ignore if already exists
				.onConflict((oc) => oc.doNothing())

				.execute();
		}
	});
}
