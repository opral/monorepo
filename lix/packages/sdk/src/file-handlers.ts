import type { LixDatabaseSchema, LixFile } from "./database/schema.js";
import type { DiffReport, LixPlugin } from "./plugin.js";
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
	const pluginDiffs: {
		diffs: DiffReport[];
		pluginKey: string;
	}[] = [];
	// console.log({ args });
	for (const plugin of args.plugins) {
		// glob expressions are expressed relative without leading / but path has leading /
		if (!minimatch(normalizePath(args.after.path), "/" + plugin.glob)) {
			break;
		}

		const diffs = await plugin.diff?.file?.({
			before: undefined,
			after: args.after,
		});

		pluginDiffs.push({ diffs: diffs ?? [], pluginKey: plugin.key });
	}

	await args.db.transaction().execute(async (trx) => {
		for (const { diffs, pluginKey } of pluginDiffs) {
			for (const diff of diffs ?? []) {
				const value = diff.before ?? diff.after;

				const snapshot = await trx
					.insertInto("snapshot")
					.values({
						// @ts-expect-error - database expects stringified json
						value: JSON.stringify(value),
					})
					.returning("id")
					.executeTakeFirstOrThrow();

				await trx
					.insertInto("change")
					.values({
						type: diff.type,
						file_id: args.after.id,
						author: args.currentAuthor,
						entity_id: diff.entity_id,
						plugin_key: pluginKey,
						snapshot_id: snapshot.id,
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

	const pluginDiffs: {
		diffs: DiffReport[];
		pluginKey: string;
	}[] = [];

	for (const plugin of args.plugins) {
		// glob expressions are expressed relative without leading / but path has leading /
		if (!minimatch(normalizePath(args.after.path), "/" + plugin.glob)) {
			break;
		}

		const diffs = await plugin.diff?.file?.({
			before: args.before,
			after: args.after,
		});

		pluginDiffs.push({
			diffs: diffs ?? [],
			pluginKey: plugin.key,
		});
	}

	await args.db.transaction().execute(async (trx) => {
		for (const { diffs, pluginKey } of pluginDiffs) {
			for (const diff of diffs ?? []) {
				// assume an insert or update operation as the default
				// if diff.neu is not present, it's a delete operationd
				const value = diff.after ?? diff.before;

				// TODO: save hash of changed fles in every commit to discover inconsistent commits with blob?

				const previousChanges = await trx
					.selectFrom("change")
					.selectAll()
					.where("file_id", "=", fileId)
					.where("plugin_key", "=", pluginKey)
					.where("type", "=", diff.type)
					.where("entity_id", "=", diff.entity_id)
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
						JSON.stringify(previousSnapshot.value) === JSON.stringify(value)
					) {
						// drop the change because it's identical
						continue;
					}
				}

				const snapshot = await trx
					.insertInto("snapshot")
					.values({
						// @ts-expect-error - database expects stringified json
						value: JSON.stringify(value),
					})
					.returning("id")
					.executeTakeFirstOrThrow();

				await trx
					.insertInto("change")
					.values({
						type: diff.type,
						file_id: fileId,
						plugin_key: pluginKey,
						entity_id: diff.entity_id,
						author: args.currentAuthor,
						parent_id: previousChange?.id,
						snapshot_id: snapshot.id,
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
