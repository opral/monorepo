import { v4 } from "uuid";
import type { LixDatabaseSchema, LixFile } from "./database/schema.js";
import type { LixPlugin } from "./plugin.js";
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
	const pluginDiffs: any[] = [];

	// console.log({ args });
	for (const plugin of args.plugins) {
		// glob expressions are expressed relative without leading / but path has leading /
		if (!minimatch(normalizePath(args.after.path), "/" + plugin.glob)) {
			break;
		}

		const diffs = await plugin.diff!.file!({
			before: undefined,
			after: args.after,
		});
		// console.log({ diffs });

		pluginDiffs.push({ diffs, pluginKey: plugin.key });
	}

	await args.db.transaction().execute(async (trx) => {
		for (const { diffs, pluginKey } of pluginDiffs) {
			for (const diff of diffs ?? []) {
				const value = diff.before ?? diff.after;

				const snapshotId = (await trx
					.insertInto("snapshot")
					.values({
						id: v4(),
						// @ts-expect-error - database expects stringified json
						value: JSON.stringify(value)
					})
					.returning("id")
					.executeTakeFirstOrThrow()).id

				await trx
					.insertInto("change")
					.values({
						id: v4(),
						type: diff.type,
						file_id: args.after.id,
						author: args.currentAuthor,
						plugin_key: pluginKey,
						operation: diff.operation,
						snapshot_id: snapshotId,
						// @ts-expect-error - database expects stringified json
						meta: JSON.stringify(diff.meta),
						// add queueId interesting for debugging or knowning what changes were generated in same worker run
					})
					.execute();
			}
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

	const pluginDiffs: any[] = [];

	for (const plugin of args.plugins) {
		// glob expressions are expressed relative without leading / but path has leading /
		if (!minimatch(normalizePath(args.after.path), "/" + plugin.glob)) {
			break;
		}

		const diffs = await plugin.diff!.file!({
			before: args.before,
			after: args.after,
		});

		pluginDiffs.push({
			diffs,
			pluginKey: plugin.key,
			pluginDiffFunction: plugin.diff,
		});
	}

	await args.db.transaction().execute(async (trx) => {
		for (const { diffs, pluginKey, pluginDiffFunction } of pluginDiffs) {
			for (const diff of diffs ?? []) {
				// assume an insert or update operation as the default
				// if diff.neu is not present, it's a delete operationd
				const value = diff.after ?? diff.before;

				// TODO: save hash of changed fles in every commit to discover inconsistent commits with blob?

				const previousChanges = await trx
					.selectFrom("change")
					.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
					.selectAll()
					.where("file_id", "=", fileId)
					.where("plugin_key", "=", pluginKey)
					.where("type", "=", diff.type)
					.where((eb) => eb.ref("value", "->>").key("id"), "=", value.id)
					// TODO don't rely on created at. a plugin should report the parent id.
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

				// working change exists but is different from previously committed change
				// -> update the working change or delete if it is the same as previous uncommitted change
				// overwrite the (uncomitted) change
				// to avoid (potentially) saving every keystroke change
				let previousCommittedDiff = [];

				// working change exists but is identical to previously committed change
				if (previousChange) {
					previousCommittedDiff = await pluginDiffFunction?.[diff.type]?.({
						before: previousChange?.value,
						after: diff.after,
					});

					if (previousCommittedDiff?.length === 0) {
						// drop the change because it's identical
						continue;
					}
				}

				const snapshotId = (await trx
					.insertInto("snapshot")
					.values({
						id: v4(),
						// @ts-expect-error - database expects stringified json
						value: JSON.stringify(value),
					})
					.returning('id')
					.executeTakeFirstOrThrow()).id;

				await trx
					.insertInto("change")
					.values({
						id: v4(),
						type: diff.type,
						file_id: fileId,
						plugin_key: pluginKey,
						author: args.currentAuthor,
						parent_id: previousChange?.id,
						snapshot_id: snapshotId,
						// @ts-expect-error - database expects stringified json
						meta: JSON.stringify(diff.meta),
						operation: diff.operation,
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
