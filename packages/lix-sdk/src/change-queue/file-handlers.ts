import type { ChangeQueueEntry } from "../database/schema.js";
import type { DetectedChange } from "../plugin/lix-plugin.js";
import { minimatch } from "minimatch";
import { updateBranchPointers } from "../branch/update-branch-pointers.js";
import { changeIsLeafInBranch } from "../query-utilities/change-is-leaf-in-branch.js";
import { createSnapshot } from "../snapshot/create-snapshot.js";
import type { Lix } from "../lix/open-lix.js";

// start a new normalize path function that has the absolute minimum implementation.
function normalizePath(path: string) {
	if (!path.startsWith("/")) {
		return "/" + path;
	}
	return path;
}

// creates initial changes for new files
export async function handleFileInsert(args: {
	lix: Pick<Lix, "db" | "plugin">;
	changeQueueEntry: ChangeQueueEntry;
}): Promise<void> {
	const detectedChanges: Array<DetectedChange & { pluginKey: string }> = [];

	const plugins = await args.lix.plugin.getAll();

	// the path of the file is either the after path or the before path
	// depending on whether the file was deleted, updated, or created
	const path =
		args.changeQueueEntry.path_after ?? args.changeQueueEntry.path_before;

	if (path === null) {
		throw new Error("Both before and after paths are null");
	}

	for (const plugin of plugins) {
		// glob expressions are expressed relative without leading / but path has leading /
		if (!minimatch(normalizePath(path), "/" + plugin.detectChangesGlob)) {
			break;
		}

		if (plugin.detectChanges === undefined) {
			const error = new Error(
				"Plugin does not support detecting changes even though the glob matches.",
			);
			// https://linear.app/opral/issue/LIXDK-195/await-change-queue-to-log-errors
			console.error(error);
			throw error;
		}

		if (args.changeQueueEntry.data_after === null) {
			throw new Error("Data after is null");
		}

		for (const change of await plugin.detectChanges({
			before: undefined,
			after: {
				id: args.changeQueueEntry.file_id,
				path,
				metadata: args.changeQueueEntry.metadata_after,
				data: args.changeQueueEntry.data_after,
			},
		})) {
			detectedChanges.push({
				...change,
				pluginKey: plugin.key,
			});
		}
	}

	await args.lix.db.transaction().execute(async (trx) => {
		const currentBranch = await trx
			.selectFrom("current_branch")
			.innerJoin("branch", "current_branch.id", "branch.id")
			.selectAll()
			.executeTakeFirstOrThrow();

		for (const detectedChange of detectedChanges) {
			const snapshot = await createSnapshot({
				lix: { db: trx },
				content: detectedChange.snapshot,
			});

			const insertedChange = await trx
				.insertInto("change")
				.values({
					schema_key: detectedChange.schema.key,
					file_id: args.changeQueueEntry.file_id,
					entity_id: detectedChange.entity_id,
					plugin_key: detectedChange.pluginKey,
					snapshot_id: snapshot.id,
				})
				.returningAll()
				.executeTakeFirstOrThrow();

			await updateBranchPointers({
				lix: { ...args.lix, db: trx },
				changes: [insertedChange],
				branch: currentBranch,
			});
		}

		await trx
			.deleteFrom("change_queue")
			.where("id", "=", args.changeQueueEntry.id)
			.execute();
	});
}

export async function handleFileChange(args: {
	lix: Pick<Lix, "db" | "plugin">;
	changeQueueEntry: ChangeQueueEntry;
}): Promise<void> {
	const detectedChanges: Array<DetectedChange & { pluginKey: string }> = [];

	const plugins = await args.lix.plugin.getAll();

	// the path of the file is either the after path or the before path
	// depending on whether the file was deleted, updated, or created
	const path =
		args.changeQueueEntry.path_after ?? args.changeQueueEntry.path_before;

	if (path === null) {
		throw new Error("Both before and after paths are null");
	}

	for (const plugin of plugins) {
		// glob expressions are expressed relative without leading / but path has leading /
		if (!minimatch(normalizePath(path), "/" + plugin.detectChangesGlob)) {
			break;
		}
		if (plugin.detectChanges === undefined) {
			const error = new Error(
				"Plugin does not support detecting changes even though the glob matches.",
			);
			// https://linear.app/opral/issue/LIXDK-195/await-change-queue-to-log-errors
			console.error(error);
			throw error;
		}
		for (const change of await plugin.detectChanges({
			before: args.changeQueueEntry.data_before
				? {
						id: args.changeQueueEntry.file_id,
						path: path,
						metadata: args.changeQueueEntry.metadata_before,
						data: args.changeQueueEntry.data_before,
					}
				: undefined,
			after: args.changeQueueEntry.data_after
				? {
						id: args.changeQueueEntry.file_id,
						path,
						metadata: args.changeQueueEntry.metadata_after,
						data: args.changeQueueEntry.data_after,
					}
				: undefined,
		})) {
			detectedChanges.push({
				...change,
				pluginKey: plugin.key,
			});
		}
	}

	await args.lix.db.transaction().execute(async (trx) => {
		const currentBranch = await trx
			.selectFrom("current_branch")
			.innerJoin("branch", "current_branch.id", "branch.id")
			.selectAll()
			.executeTakeFirstOrThrow();
		for (const detectedChange of detectedChanges) {
			const parentChange = await trx
				.selectFrom("change")
				.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
				.selectAll("change")
				.select("snapshot.content")
				.where("file_id", "=", args.changeQueueEntry.file_id)
				.where("schema_key", "=", detectedChange.schema.key)
				.where("entity_id", "=", detectedChange.entity_id)
				.where(changeIsLeafInBranch(currentBranch))
				.executeTakeFirst();

			const snapshot = await createSnapshot({
				lix: { db: trx },
				content: detectedChange.snapshot,
			});

			const insertedChange = await trx
				.insertInto("change")
				.values({
					schema_key: detectedChange.schema.key,
					file_id: args.changeQueueEntry.file_id,
					plugin_key: detectedChange.pluginKey,
					entity_id: detectedChange.entity_id,
					snapshot_id: snapshot.id,
				})
				.returningAll()
				.executeTakeFirstOrThrow();

			await updateBranchPointers({
				lix: { ...args.lix, db: trx },
				changes: [insertedChange],
				branch: currentBranch,
			});

			// If a parent exists, the change is a child of the parent
			if (parentChange) {
				await trx
					.insertInto("change_edge")
					.values({
						parent_id: parentChange.id,
						child_id: insertedChange.id,
					})
					.execute();
			}
		}

		await trx
			.deleteFrom("change_queue")
			.where("id", "=", args.changeQueueEntry.id)
			.execute();
	});
}
