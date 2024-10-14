import { v4 } from "uuid";
import type { LixDatabaseSchema, LixFile } from "./database/schema.js";
import type { LixPlugin } from "./plugin.js";
import { minimatch } from "minimatch";
import { Kysely, sql } from "kysely";

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

	for (const plugin of args.plugins) {
		// glob expressions are expressed relative without leading / but path has leading /
		if (!minimatch(normalizePath(args.neu.path), "/" + plugin.glob)) {
			break;
		}

		const diffs = await plugin.diff!.file!({
			old: undefined,
			neu: args.neu,
		});

		pluginDiffs.push({ diffs, pluginKey: plugin.key });
	}

	await args.db.transaction().execute(async (trx) => {
		const currentBranch = await trx
			.selectFrom("branch")
			.selectAll()
			.where("active", "=", true)
			.executeTakeFirstOrThrow();

		for (const { diffs, pluginKey } of pluginDiffs) {
			for (const diff of diffs ?? []) {
				const value = diff.neu ?? diff.old;
				const changeId = v4();

				await trx
					.insertInto("change")
					.values({
						id: changeId,
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

				const previousBranchChange = await trx
					.selectFrom("branch_change")
					.selectAll()
					.where("branch_id", "=", currentBranch.id)
					.orderBy("seq", "desc")
					.executeTakeFirst();

				const lastSeq = previousBranchChange?.seq ?? 0;

				await trx
					.insertInto("branch_change")
					.values({
						id: v4(),
						seq: lastSeq + 1,
						branch_id: currentBranch.id,
						change_id: changeId,
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
		const currentBranch = await trx
			.selectFrom("branch")
			.selectAll()
			.where("active", "=", true)
			.executeTakeFirstOrThrow();

		for (const { diffs, pluginKey, pluginDiffFunction } of pluginDiffs) {
			for (const diff of diffs ?? []) {
				// assume an insert or update operation as the default
				// if diff.neu is not present, it's a delete operationd
				const value = diff.neu ?? diff.old;

				// TODO: save hash of changed fles in every commit to discover inconsistent commits with blob?

				const previousChange = await trx
					.selectFrom("branch_change")
					.leftJoin("change", "branch_change.change_id", "change.id")
					.orderBy("branch_change.seq", "desc")
					.where("change.file_id", "=", fileId)
					.where("change.plugin_key", "=", pluginKey)
					.where("change.type", "=", diff.type)
					.where("branch_change.branch_id", "=", currentBranch.id)
					.where((eb) => eb.ref("value", "->>").key("id"), "=", value.id)
					.selectAll()
					.executeTakeFirst();

				// working change exists but is different from previously committed change
				// -> update the working change or delete if it is the same as previous uncommitted change
				// overwrite the (uncomitted) change
				// to avoid (potentially) saving every keystroke change
				let previousCommittedDiff = [];

				// working change exists but is identical to previously committed change
				if (previousChange) {
					previousCommittedDiff = await pluginDiffFunction?.[diff.type]?.({
						old: previousChange.value,
						neu: diff.neu,
					});

					if (previousCommittedDiff?.length === 0) {
						continue;
					}
				}

				const changeId = v4();

				await trx
					.insertInto("change")
					.values({
						id: changeId,
						value: value,
						operation: diff.operation,
						meta: diff.meta,
						type: diff.type,
						file_id: fileId,
						plugin_key: pluginKey,
						author: args.currentAuthor,
						parent_id: previousChange?.id || undefined,
					})
					.execute();

				const previousBranchChange = await trx
					.selectFrom("branch_change")
					.selectAll()
					.where("branch_id", "=", currentBranch.id)
					.orderBy("seq", "desc")
					.executeTakeFirst();

				const lastSeq = previousBranchChange?.seq ?? 0;

				await trx
					.insertInto("branch_change")
					.values({
						id: v4(),
						seq: lastSeq + 1,
						branch_id: currentBranch.id,
						change_id: changeId,
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
