/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LixDatabaseSchema, LixFile } from "./database/schema.js";
import type { DetectedChange, LixPlugin } from "./plugin.js";
import { minimatch } from "minimatch";
import { Kysely } from "kysely";

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
	currentAuthor?: string;
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
					// TODO use empty snapshot id const https://github.com/opral/lix-sdk/issues/101
					id: detectedChange.snapshot ? undefined : "EMPTY_SNAPSHOT_ID",
					// @ts-expect-error - database expects stringified json
					value: JSON.stringify(detectedChange.snapshot),
				})
				.onConflict((oc) => oc.doNothing())
				.returning("id")
				.executeTakeFirstOrThrow();

			await trx
				.insertInto("change")
				.values({
					type: detectedChange.type,
					file_id: args.after.id,
					author: args.currentAuthor,
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
	currentAuthor?: string;
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
			// TODO: save hash of changed fles in every commit to discover inconsistent commits with blob?

			const previousChanges = await trx
				.selectFrom("change")
				.selectAll()
				.where("file_id", "=", fileId)
				.where("plugin_key", "=", detectedChange.pluginKey)
				.where("type", "=", detectedChange.type)
				.where("entity_id", "=", detectedChange.entity_id)
				.execute();

			// we need to finde the real leaf change as multiple changes can be set in the same created timestamp second or clockskew
			let previousChange; // = previousChanges.at(-1);
			for (let i = previousChanges.length - 1; i >= 0; i--) {
				for (const change of previousChanges) {
					if (change.parent_id === previousChanges[i]?.id) {
						break;
					}
				}
				previousChange = previousChanges[i];
				break;
			}

			// working change exists but is identical to previously committed change
			if (previousChange) {
				const previousSnapshot = await trx
					.selectFrom("snapshot")
					.selectAll()
					.where("id", "=", previousChange.snapshot_id)
					.executeTakeFirstOrThrow();

				if (
					// json stringify should be good enough if the plugin diff function is deterministic
					JSON.stringify(previousSnapshot.value) ===
					JSON.stringify(detectedChange.snapshot)
				) {
					// drop the change because it's identical
					continue;
				}
			}

			const snapshot = await trx
				.insertInto("snapshot")
				.values({
					// TODO use empty snapshot id const https://github.com/opral/lix-sdk/issues/101
					id: detectedChange.snapshot ? undefined : "EMPTY_SNAPSHOT_ID",
					// @ts-expect-error - database expects stringified json
					value: JSON.stringify(detectedChange.snapshot),
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
					author: args.currentAuthor,
					parent_id: previousChange?.id,
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
