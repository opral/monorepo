import type { LixPlugin } from "../plugin.js";
import type { Change } from "../schema.js";
import type { Lix } from "../types.js";

/**
 * Combines the changes of two lixes into the target lix.
 */
export async function merge(args: {
	target: Lix;
	source: Lix;
	// TODO selectively merge changes
	// onlyTheseChanges
}): Promise<void> {
	const toBeAppliedChanges: Record<LixPlugin["key"], Array<Change>> = {};

	// TODO ideally a right join via sqlite attaching works
	//      instead of fetching all changes from source
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
		// copy change to target
		await args.target.db
			.insertInto("change")
			.values({
				...change,
				// @ts-expect-error - fix auto serialization
				value: JSON.stringify(change.value),
			})
			.execute();

		// 2. Check plugin if conflict exists
		const plugin = args.source.plugins.find((p) => p.key === change.plugin_key);

		if (!plugin) {
			throw new Error("Plugin not found");
		}

		if (!plugin.detectConflicts) {
			throw new Error("Plugin does not support detecting conflicts");
		}

		// TODO bug this is a bug
		const conflict = await plugin.detectConflicts({
			sourceLix: args.source,
			targetLix: args.target,
		});

		if (conflict) {
			await args.target.db.insertInto("conflict").values(conflict).execute();
			// copy the change to the target
			continue;
		}

		if (!toBeAppliedChanges[change.plugin_key]) {
			toBeAppliedChanges[change.plugin_key] = [];
		}
		toBeAppliedChanges[change.plugin_key]?.push(change);
	}

	// 3. apply non-conflicting changes to target
	for (const [pluginKey, changes] of Object.entries(toBeAppliedChanges)) {
		if (changes.length === 0) {
			continue;
		}
		const plugin = args.source.plugins.find((p) => p.key === pluginKey);
		const file = await args.target.db
			.selectFrom("file")
			.selectAll()
			// todo fix changes for one plugin can belong to different files
			.where("id", "=", changes[0]!.file_id)
			.executeTakeFirst();

		// todo: how to deal with missing files?
		if (!file) {
			throw new Error("File not found");
		}

		if (!plugin) {
			throw new Error("Plugin not found");
		}

		if (!plugin.applyChanges) {
			throw new Error("Plugin does not support applying changes");
		}

		const { fileData } = await plugin.applyChanges({
			changes,
			file,
			lix: args.target,
		});

		await args.target.db
			.updateTable("file")
			.set("data", fileData)
			.where("id", "=", file.id)
			.execute();
	}
}
