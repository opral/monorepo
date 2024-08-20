/* eslint-disable unicorn/prefer-array-find */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { LixPlugin } from "../plugin.js";
import type { Change } from "../schema.js";
import type { Lix } from "../types.js";
import { getLeafChangesOnlyInSource } from "../query-utilities/get-leaf-changes-only-in-source.js";

/**
 * Combined the changes of the source lix into the target lix.
 */
export async function merge(args: {
	target: Lix;
	source: Lix;
	// TODO selectively merge changes
	// onlyTheseChanges
}): Promise<void> {
	// TODO
	// This function is unoptimized and loops like crazy.
	// But, it's good enough for prototypes.
	const toBeCopiedChanges: Change[] = [];

	// TODO use `getLeafChangesOnlyInSource` and
	//      combined with `getCommonParent` to only
	//      traverse the changes that are needed.
	const sourceChanges = await args.source.db
		.selectFrom("change")
		.selectAll()
		.execute();

	// 1. Get the changes that exists in source but not in target
	for (const change of sourceChanges) {
		const targetChange = await args.target.db
			.selectFrom("change")
			.select("id")
			.where("id", "=", change.id)
			.executeTakeFirst();

		// change already exists, skip
		if (targetChange !== undefined) {
			continue;
		}
		toBeCopiedChanges.push(change);
	}

	// TODO don't query the changes again. Very inefficient.
	const leafChangesOnlyInSource = await getLeafChangesOnlyInSource({
		sourceLix: args.source,
		targetLix: args.target,
	});

	// 2. Let the plugin detect conflicts

	const plugin = args.source.plugins[0] as LixPlugin;

	// TODO function assumes that all changes belong to the same file
	if (args.source.plugins.length !== 1) {
		throw new Error("Unimplemented. Only one plugin is supported for now");
	} else if (plugin.detectConflicts === undefined) {
		throw new Error("Plugin does not support conflict detection");
	}
	const conflicts = await plugin.detectConflicts({
		sourceLix: args.source,
		targetLix: args.target,
		leafChangesOnlyInSource,
	});

	// 3. apply non conflicting leaf changes
	// TODO extremely inefficient double looping
	const nonConflictingLeafChangesInSource = leafChangesOnlyInSource.filter(
		(c) =>
			conflicts.every((conflict) => conflict.conflicting_change_id !== c.id),
	);

	const file = await args.target.db
		.selectFrom("file")
		.selectAll()
		// todo fix changes for one plugin can belong to different files
		.where(
			"id",
			"=",
			// todo handle multiple files
			toBeCopiedChanges[0]!.file_id,
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
		lix: args.target,
	});

	await args.target.db.transaction().execute(async (trx) => {
		// 1. copy the changes from source
		await trx
			.insertInto("change")
			.values(
				// @ts-expect-error - todo auto serialize values
				toBeCopiedChanges.map((change) => ({
					...change,
					value: JSON.stringify(change.value),
				})),
			)
			.execute();

		// 2. insert the conflicts of those changes
		if (conflicts.length > 0) {
			await trx.insertInto("conflict").values(conflicts).execute();
		}

		// 3. update the file data with the applied changes
		await trx
			.updateTable("file")
			.set("data", fileData)
			.where("id", "=", file.id)
			.execute();
	});
}
