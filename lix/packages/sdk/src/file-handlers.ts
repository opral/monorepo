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
	neu: LixFile;
	plugins: LixPlugin[];
	db: Kysely<LixDatabaseSchema>;
	currentAuthor?: string;
	queueEntry: any;
}) {
	const pluginDiffs: any[] = [];

	// console.log({ args });
	for (const plugin of args.plugins) {
		// glob expressions are expressed relative without leading / but path has leading /
		if (!minimatch(normalizePath(args.neu.path), "/" + plugin.glob)) {
			break;
		}

		const diffs = await plugin.diff!.file!({
			old: undefined,
			neu: args.neu,
		});
		// console.log({ diffs });

		pluginDiffs.push({ diffs, pluginKey: plugin.key });
	}

	await args.db.transaction().execute(async (trx) => {
		for (const { diffs, pluginKey } of pluginDiffs) {
			for (const diff of diffs ?? []) {
				const value = diff.neu ?? diff.old;

				await trx
					.insertInto("change")
					.values({
						id: v4(),
						type: diff.type,
						file_id: args.neu.id,
						author: args.currentAuthor,
						plugin_key: pluginKey,
						operation: diff.operation,
						// @ts-expect-error - database expects stringified json
						value: JSON.stringify(value),
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
	old: LixFile;
	neu: LixFile;
	plugins: LixPlugin[];
	currentAuthor?: string;
	db: Kysely<LixDatabaseSchema>;
}) {
	const fileId = args.neu?.id ?? args.old?.id;

	const pluginDiffs: any[] = [];

	for (const plugin of args.plugins) {
		// glob expressions are expressed relative without leading / but path has leading /
		if (!minimatch(normalizePath(args.neu.path), "/" + plugin.glob)) {
			break;
		}

		const diffs = await plugin.diff!.file!({
			old: args.old,
			neu: args.neu,
		});

		pluginDiffs.push({
			diffs,
			pluginKey: plugin.key,
			pluginDiffFunction: plugin.diff,
		});
	}

	await args.db.transaction().execute(async (trx) => {
		for (const { diffs, pluginKey } of pluginDiffs) {
			for (const diff of diffs ?? []) {
				// assume an insert or update operation as the default
				// if diff.neu is not present, it's a delete operationd
				const value = diff.neu ?? diff.old;

				// TODO: save hash of changed fles in every commit to discover inconsistent commits with blob?

				// TODO make more resilient

				const parentChange = await trx
					.selectFrom("change")
					.selectAll()
					.where("file_id", "=", fileId)
					.where((eb) => eb.ref("value", "->>").key("id"), "=", value.id)
					// TODO don't rely on created at. a plugin should report the parent id.
					.orderBy("created_at desc")
					.executeTakeFirst();

				await trx
					.insertInto("change")
					.values({
						id: v4(),
						type: diff.type,
						file_id: fileId,
						plugin_key: pluginKey,
						author: args.currentAuthor,
						parent_id: parentChange?.id,
						// @ts-expect-error - database expects stringified json
						value: JSON.stringify(value),
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
