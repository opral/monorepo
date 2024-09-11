/* eslint-disable unicorn/prefer-array-find */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { LixPlugin } from "../plugin.js";
import type { Lix } from "../types.js";
import { getLeafChangesOnlyInSource } from "../query-utilities/get-leaf-changes-only-in-source.js";

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
	//      and only get the changes and commits that
	//      are not in target.
	const sourceChanges = await args.sourceLix.db
		.selectFrom("change")
		.selectAll()
		.execute();

	// // TODO increase performance by only getting commits
	// //      that are not in target in the future.
	// const sourceCommits = await args.sourceLix.db
	// 	.selectFrom("commit")
	// 	.selectAll()
	// 	.execute();

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
	const conflicts = await plugin.detectConflicts({
		sourceLix: args.sourceLix,
		targetLix: args.targetLix,
		leafChangesOnlyInSource,
	});

	// 3. apply non conflicting leaf changes
	// TODO inefficient double looping
	const nonConflictingLeafChangesInSource = leafChangesOnlyInSource.filter(
		(c) =>
			conflicts.every((conflict) => conflict.conflicting_change_id !== c.id),
	);

	const file = await args.targetLix.db
		.selectFrom("file")
		.selectAll()
		// todo fix changes for one plugin can belong to different files
		.where(
			"id",
			"=",
			// todo handle multiple files
			sourceChanges[0]!.file_id,
		)
		.executeTakeFirst();

	// todo: how to deal with missing files?
	if (!file) {
		throw new Error("File not found");
	}

	if (!plugin.applyChanges) {
		throw new Error("Plugin does not support applying changes");
	}

	const { fileData } = await plugin.applyChanges({
		changes: nonConflictingLeafChangesInSource,
		file,
		lix: args.targetLix,
	});

	await args.targetLix.db.transaction().execute(async (trx) => {
		if (sourceChanges.length > 0) {
			// 1. copy the changes from source
			await trx
				.insertInto("change")
				.values(
					// @ts-expect-error - todo auto serialize values
					// https://github.com/opral/inlang-message-sdk/issues/123
					sourceChanges.map((change) => ({
						...change,
						value: JSON.stringify(change.value),
						meta: JSON.stringify(change.meta),
					})),
				)
				// ignore if already exists
				.onConflict((oc) => oc.doNothing())
				.execute();
		}

		// // 2. copy the commits from source
		// if (sourceCommits.length > 0) {
		// 	await trx
		// 		.insertInto("commit")
		// 		.values(sourceCommits)
		// 		// ignore if already exists
		// 		.onConflict((oc) => oc.doNothing())
		// 		.execute();
		// }

		// 3. insert the conflicts of those changes
		if (conflicts.length > 0) {
			await trx
				.insertInto("conflict")
				.values(conflicts)
				// ignore if already exists
				.onConflict((oc) => oc.doNothing())
				.execute();
		}

		// 4. update the file data with the applied changes
		await trx
			.updateTable("file_internal")
			.set("data", fileData)
			.where("id", "=", file.id)
			.execute();
	});
}
