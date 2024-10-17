/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LixDatabaseSchema, LixFile } from "./database/schema.js";
import type { DetectedChange, LixPlugin } from "./plugin.js";
import { minimatch } from "minimatch";
import { Kysely } from "kysely";
import { getLeafChange } from "./query-utilities/get-leaf-change.js";
import { isInSimulatedCurrentBranch } from "./query-utilities/is-in-simulated-branch.js";

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
	db: Kysely<LixDatabaseSchema>;
	queueEntry: any;
}) {
	const detectedChanges: Array<DetectedChange & { pluginKey: string }> = [];

	for (const plugin of args.plugins) {
		// glob expressions are expressed relative without leading / but path has leading /
		if (!minimatch(normalizePath(args.after.path), "/" + plugin.glob)) {
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

	await args.db.transaction().execute(async (trx) => {
		for (const detectedChange of detectedChanges) {
			const snapshot = await trx
				.insertInto("snapshot")
				.values({
					// @ts-expect-error- database expects stringified json
					value: detectedChange.snapshot
						? JSON.stringify(detectedChange.snapshot)
						: null,
				})
				.onConflict((oc) => oc.doNothing())
				.returning("id")
				.executeTakeFirstOrThrow();

			await trx
				.insertInto("change")
				.values({
					type: detectedChange.type,
					file_id: args.after.id,
					entity_id: detectedChange.entity_id,
					plugin_key: detectedChange.pluginKey,
					snapshot_id: snapshot.id,
				})
				.execute();
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
	db: Kysely<LixDatabaseSchema>;
}) {
	const fileId = args.after?.id ?? args.before?.id;

	const detectedChanges: Array<DetectedChange & { pluginKey: string }> = [];

	for (const plugin of args.plugins) {
		// glob expressions are expressed relative without leading / but path has leading /
		if (!minimatch(normalizePath(args.after.path), "/" + plugin.glob)) {
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

	await args.db.transaction().execute(async (trx) => {
		for (const detectedChange of detectedChanges) {
			// heuristic to find the previous change
			// there is no guarantee that the previous change is the leaf change
			// because sorting by time is unreliable in a distributed system
			const previousChange = await trx
				.selectFrom("change")
				.selectAll()
				.where("file_id", "=", fileId)
				.where("type", "=", detectedChange.type)
				.where("entity_id", "=", detectedChange.entity_id)
				.where(isInSimulatedCurrentBranch)
				// walk from the end of the tree to minimize the amount of changes to walk
				.orderBy("id", "desc")
				.executeTakeFirst();

			// get the leaf change of the assumed previous change
			const leafChange = !previousChange
				? undefined
				: await getLeafChange({
						lix: { db: trx },
						change: previousChange,
					});

			const snapshot = await trx
				.insertInto("snapshot")
				.values({
					// @ts-expect-error- database expects stringified json
					value: detectedChange.snapshot
						? JSON.stringify(detectedChange.snapshot)
						: null,
				})
				.onConflict((oc) => oc.doNothing())
				.returning("id")
				.executeTakeFirstOrThrow();

			await trx
				.insertInto("change")
				.values({
					type: detectedChange.type,
					file_id: fileId,
					plugin_key: detectedChange.pluginKey,
					entity_id: detectedChange.entity_id,
					parent_id: leafChange?.id,
					snapshot_id: snapshot.id,
				})
				.execute();
		}

		await trx
			.deleteFrom("change_queue")
			.where("id", "=", args.queueEntry.id)
			.execute();
	});
}
