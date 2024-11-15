/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LixFile } from "../database/schema.js";
import type { DetectedChange, LixPlugin } from "../plugin/lix-plugin.js";
import { minimatch } from "minimatch";
import { updateBranchPointers } from "../branch/update-branch-pointers.js";
import { changeIsLeafInBranch } from "../query-utilities/change-is-leaf-in-branch.js";
import { createSnapshot } from "../snapshot/create-snapshot.js";
import type { Lix } from "./open-lix.js";

// start a new normalize path function that has the absolute minimum implementation.
function normalizePath(path: string) {
	if (!path.startsWith("/")) {
		return "/" + path;
	}
	return path;
}

// creates initial changes for new files
export async function handleFileInsert(args: {
	after: LixFile;
	plugins: LixPlugin[];
	lix: Pick<Lix, "db" | "plugin">;
	queueEntry: any;
}): Promise<void> {
	const detectedChanges: Array<DetectedChange & { pluginKey: string }> = [];

	for (const plugin of args.plugins) {
		// glob expressions are expressed relative without leading / but path has leading /
		if (
			!minimatch(normalizePath(args.after.path), "/" + plugin.detectChangesGlob)
		) {
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
			before: undefined,
			after: args.after,
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
					file_id: args.after.id,
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

		// TODO: decide if TRIGGER or in js land with await trx.insertInto('file_internal').values({ id: args.fileId, blob: args.newBlob, path: args.newPath }).execute()
		await trx
			.deleteFrom("change_queue")
			.where("id", "=", args.queueEntry.id)
			.execute();
	});
}

export async function handleFileChange(args: {
	queueEntry: any;
	before: LixFile;
	after: LixFile;
	plugins: LixPlugin[];
	lix: Pick<Lix, "db" | "plugin">;
}): Promise<void> {
	const fileId = args.after?.id ?? args.before?.id;

	const detectedChanges: Array<DetectedChange & { pluginKey: string }> = [];

	for (const plugin of args.plugins) {
		// glob expressions are expressed relative without leading / but path has leading /
		if (
			!minimatch(normalizePath(args.after.path), "/" + plugin.detectChangesGlob)
		) {
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
			before: args.before,
			after: args.after,
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
				.where("file_id", "=", fileId)
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
					file_id: fileId,
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
			.where("id", "=", args.queueEntry.id)
			.execute();
	});
}
