/* eslint-disable unicorn/prefer-array-find */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { LixPlugin } from "../plugin.js";
import type { Lix } from "../types.js";
import { getLeafChangesOnlyInSource } from "../query-utilities/get-leaf-changes-only-in-source.js";

/**
 * Combined the changes of the source lix into the target lix.
 */
export async function merge(args: {
	sourceLix: Lix;
	targetLix: Lix;
	sourceBranchId?: string;
	targetBranchId?: string;
	// TODO selectively merge changes
	// onlyTheseChanges
}): Promise<void> {
	// TODO increase performance by using attach mode
	//      and only get the changes and commits that
	//      are not in target.

	const sourceBranchId =
		args.sourceBranchId ||
		(
			await args.sourceLix.db
				.selectFrom("branch")
				.select("id")
				.where("active", "=", true)
				.executeTakeFirstOrThrow()
		).id;

	const targetBranchId =
		args.targetBranchId ||
		(
			await args.targetLix.db
				.selectFrom("branch")
				.select("id")
				.where("active", "=", true)
				.executeTakeFirstOrThrow()
		).id;

	const sourceChanges = await args.sourceLix.db
		.selectFrom("change_view")
		.selectAll()
		.where("branch_id", "=", sourceBranchId)
		.execute();

	// TODO don't query the changes again. inefficient.
	const leafChangesOnlyInSource = await getLeafChangesOnlyInSource({
		sourceLix: args.sourceLix,
		targetLix: args.targetLix,
	});
	// 2. Let the plugin detect conflicts

	const plugin = args.sourceLix.plugins[0] as LixPlugin;

	// TODO function assumes that all changes belong to the same file
	if (args.sourceLix.plugins.length !== 1) {
		throw new Error("Unimplemented. Only one plugin is supported for now");
	} else if (plugin.detectConflicts === undefined) {
		throw new Error("Plugin does not support conflict detection");
	}
	const conflicts = (
		await plugin.detectConflicts({
			sourceLix: args.sourceLix,
			targetLix: args.targetLix,
			leafChangesOnlyInSource,
		})
	).map((c) => ({ ...c, branch_id: targetBranchId }));

	const changesPerFile: Record<string, ArrayBuffer> = {};

	const fileIds = new Set(sourceChanges.map((c) => c.file_id));

	const nonConflictingLeafChangesInSource = leafChangesOnlyInSource.filter(
		(c) =>
			conflicts.every((conflict) => conflict.conflicting_change_id !== c.id),
	);

	for (const fileId of fileIds) {
		// 3. apply non conflicting leaf changes
		// TODO inefficient double looping
		const nonConflictingLeafChangesInSourceForFile =
			nonConflictingLeafChangesInSource.filter((c) => c.file_id === fileId);

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
				.executeTakeFirstOrThrow();

			await args.targetLix.db
				.insertInto("file_internal")
				.values({
					id: file.id,
					path: file.path,
					data: file.data,
					metadata: file.metadata,
				})
				.executeTakeFirst();
		}

		if (!plugin.applyChanges) {
			throw new Error("Plugin does not support applying changes");
		}

		const { fileData } = await plugin.applyChanges({
			changes: nonConflictingLeafChangesInSourceForFile,
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

	const sourceDiscsussionChangeMappings = await args.sourceLix.db
		.selectFrom("discussion_change_map")
		.selectAll()
		.execute();

	const sourceComments = await args.sourceLix.db
		.selectFrom("comment")
		.selectAll()
		.execute();

	await args.targetLix.db.transaction().execute(async (trx) => {
		if (sourceChanges.length > 0) {
			// 1. copy the changes from source
			let lastSeq = await trx
				.selectFrom("branch_change")
				.select("seq")
				.where("branch_change.branch_id", "=", targetBranchId)
				.executeTakeFirst();

			for (const toCopyChange of sourceChanges.map((change) => ({
				...change,
				branch_id: undefined,
				seq: undefined,
				value: JSON.stringify(change.value),
				meta: JSON.stringify(change.meta),
			}))) {
				const existing = await trx
					.selectFrom("change")
					.select("id")
					.where("id", "=", toCopyChange.id)
					.executeTakeFirst();

				if (!existing) {
					await trx
						.insertInto("change")
						.values(
							// @ts-expect-error - todo auto serialize values
							// https://github.com/opral/inlang-message-sdk/issues/123
							toCopyChange,
						)
						.execute();
				}

				if (
					!existing &&
					nonConflictingLeafChangesInSource.find(
						(entry) => entry.id === toCopyChange.id,
					)
				) {
					await trx
						.insertInto("branch_change")
						.values({
							id: toCopyChange.id,
							branch_id: targetBranchId, // todo: only for leaf change
							change_id: toCopyChange.id,
							seq: (lastSeq?.seq || 0) + 1,
						})
						.execute();
				}
			}
		}

		// 3. insert the conflicts of those changes
		if (conflicts.length > 0) {
			await trx
				.insertInto("conflict")
				.values(conflicts)
				// ignore if already exists
				.onConflict((oc) => oc.doNothing())
				.execute();
		}

		for (const [fileId, fileData] of Object.entries(changesPerFile)) {
			// 4. update the file data with the applied changes
			await trx
				.updateTable("file_internal")
				.set("data", fileData)
				.where("id", "=", fileId)
				.execute();
		}

		// 5. add discussions, comments and discsussion_change_mappings

		if (sourceDiscussions.length > 0) {
			await trx
				.insertInto("discussion")
				.values(sourceDiscussions)
				// ignore if already exists
				.onConflict((oc) => oc.doNothing())
				.execute();
		}

		if (sourceDiscsussionChangeMappings.length > 0) {
			await trx
				.insertInto("discussion_change_map")
				.values(sourceDiscsussionChangeMappings)
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
