import type { Change } from "../database/schema.js";
import type { DetectedChange } from "../plugin/lix-plugin.js";
import type { Lix } from "../lix/open-lix.js";
import { sql } from "kysely";
import { createChange } from "../change/create-change.js";
import { changeIsLeafInVersion } from "../query-filter/change-is-leaf-in-version.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import type { FileQueueEntry } from "./database-schema.js";

async function glob(args: {
	lix: Pick<Lix, "db">;
	glob: string;
	path: string;
}) {
	const result =
		await sql`SELECT CASE WHEN ${args.path} GLOB ${args.glob} THEN 1 ELSE 0 END AS matches`.execute(
			args.lix.db
		);

	// Extract the result from the response

	return (result.rows[0] as any)?.matches === 1;
}

// creates initial changes for new files
export async function handleFileInsert(args: {
	lix: Pick<Lix, "db" | "plugin" | "sqlite">;
	fileQueueEntry: FileQueueEntry;
}): Promise<void> {
	const detectedChanges: Array<DetectedChange & { pluginKey: string }> = [];

	const plugins = await args.lix.plugin.getAll();

	// the path of the file is either the after path or the before path
	// depending on whether the file was deleted, updated, or created
	const path =
		args.fileQueueEntry.path_after ?? args.fileQueueEntry.path_before;

	if (path === null) {
		throw new Error("Both before and after paths are null");
	}

	for (const plugin of plugins) {
		// glob expressions and paths should be properly normalized
		if (
			!plugin.detectChangesGlob ||
			!(await glob({
				lix: args.lix,
				path,
				glob: plugin.detectChangesGlob,
			}))
		) {
			break;
		}

		if (plugin.detectChanges === undefined) {
			const error = new Error(
				"Plugin does not support detecting changes even though the glob matches."
			);
			// https://linear.app/opral/issue/LIXDK-195/await-change-queue-to-log-errors
			console.error(error);
			throw error;
		}

		if (args.fileQueueEntry.data_after === null) {
			throw new Error("Data after is null");
		}

		for (const change of await plugin.detectChanges({
			lix: args.lix,
			before: undefined,
			after: {
				id: args.fileQueueEntry.file_id,
				path,
				metadata: args.fileQueueEntry.metadata_after,
				data: args.fileQueueEntry.data_after,
			},
		})) {
			detectedChanges.push({
				...change,
				pluginKey: plugin.key,
			});
		}
	}

	await args.lix.db.transaction().execute(async (trx) => {
		const currentAuthors = await trx
			.selectFrom("active_account")
			.selectAll()
			.execute();

		const currentVersion = await trx
			.selectFrom("current_version")
			.innerJoin("version", "current_version.id", "version.id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		const insertedChanges = await Promise.all(
			detectedChanges.map(async (detectedChange) => {
				return await createChange({
					lix: { ...args.lix, db: trx },
					authors: currentAuthors,
					version: currentVersion,
					entityId: detectedChange.entity_id,
					fileId: args.fileQueueEntry.file_id,
					pluginKey: detectedChange.pluginKey,
					schemaKey: detectedChange.schema.key,
					snapshotContent: detectedChange.snapshot,
				});
			})
		);

		await updateChangesInActiveVersion({
			lix: { ...args.lix, db: trx },
			changes: insertedChanges,
		});

		await trx
			.deleteFrom("file_queue")
			.where("id", "=", args.fileQueueEntry.id)
			.execute();
	});
}

export async function handleFileUpdate(args: {
	lix: Pick<Lix, "db" | "plugin" | "sqlite">;
	fileQueueEntry: FileQueueEntry;
}): Promise<void> {
	const detectedChanges: Array<DetectedChange & { pluginKey: string }> = [];

	const plugins = await args.lix.plugin.getAll();

	// the path of the file is either the after path or the before path
	// depending on whether the file was deleted, updated, or created
	const path =
		args.fileQueueEntry.path_after ?? args.fileQueueEntry.path_before;

	if (path === null) {
		throw new Error("Both before and after paths are null");
	}

	for (const plugin of plugins) {
		// glob expressions and paths should be properly normalized
		if (
			!plugin.detectChangesGlob ||
			!(await glob({
				lix: args.lix,
				path,
				glob: plugin.detectChangesGlob,
			}))
		) {
			break;
		}
		if (plugin.detectChanges === undefined) {
			const error = new Error(
				"Plugin does not support detecting changes even though the glob matches."
			);
			// https://linear.app/opral/issue/LIXDK-195/await-change-queue-to-log-errors
			console.error(error);
			throw error;
		}
		for (const change of await plugin.detectChanges({
			lix: args.lix,
			before: args.fileQueueEntry.data_before
				? {
						id: args.fileQueueEntry.file_id,
						path: path,
						metadata: args.fileQueueEntry.metadata_before,
						data: args.fileQueueEntry.data_before,
					}
				: undefined,
			after: {
				id: args.fileQueueEntry.file_id,
				path,
				metadata: args.fileQueueEntry.metadata_after,
				data: args.fileQueueEntry.data_after!,
			},
		})) {
			detectedChanges.push({
				...change,
				pluginKey: plugin.key,
			});
		}
	}

	await args.lix.db.transaction().execute(async (trx) => {
		const currentAuthors = await trx
			.selectFrom("active_account")
			.selectAll()
			.execute();

		const currentVersion = await trx
			.selectFrom("current_version")
			.innerJoin("version", "current_version.id", "version.id")
			.selectAll()
			.executeTakeFirstOrThrow();

		const insertedChanges = await Promise.all(
			detectedChanges.map(async (detectedChange) => {
				return await createChange({
					lix: { ...args.lix, db: trx },
					authors: currentAuthors,
					version: currentVersion,
					entityId: detectedChange.entity_id,
					fileId: args.fileQueueEntry.file_id,
					pluginKey: detectedChange.pluginKey,
					schemaKey: detectedChange.schema.key,
					snapshotContent: detectedChange.snapshot,
				});
			})
		);

		await updateChangesInActiveVersion({
			lix: { ...args.lix, db: trx },
			changes: insertedChanges,
		});

		await trx
			.deleteFrom("file_queue")
			.where("id", "=", args.fileQueueEntry.id)
			.execute();
	});
}

/**
 * File deletions don't need to invoke a plugin to detect changes.
 *
 * Instead, we can simply query the database for all changes that are related to the file
 * and create the corresponding deletion changes for the current version.
 *
 * - simpler plugin API (because deletions don't need to be accounted for)
 * - faster file deletion (because we don't need to invoke plugins)
 */
export async function handleFileDelete(args: {
	lix: Pick<Lix, "db" | "plugin" | "sqlite">;
	fileQueueEntry: FileQueueEntry;
}): Promise<void> {
	await args.lix.db.transaction().execute(async (trx) => {
		const currentVersion = await trx
			.selectFrom("current_version")
			.innerJoin("version", "current_version.id", "version.id")
			.selectAll()
			.executeTakeFirstOrThrow();

		const toBeDeletedEntities = await trx
			.selectFrom("change")
			.where("file_id", "=", args.fileQueueEntry.file_id)
			.where(changeIsLeafInVersion(currentVersion))
			.select("entity_id")
			.select("schema_key")
			.select("plugin_key")
			.execute();

		const currentAuthors = await trx
			.selectFrom("active_account")
			.selectAll()
			.execute();

		const insertedChanges = await Promise.all(
			toBeDeletedEntities.map(async (change) => {
				return await createChange({
					lix: { ...args.lix, db: trx },
					authors: currentAuthors,
					version: currentVersion,
					entityId: change.entity_id,
					fileId: args.fileQueueEntry.file_id,
					pluginKey: change.plugin_key,
					schemaKey: change.schema_key,
					snapshotContent: null, // Snapshot is null for deletions
				});
			})
		);

		await updateChangesInActiveVersion({
			lix: { ...args.lix, db: trx },
			changes: insertedChanges,
		});

		await trx
			.deleteFrom("file_queue")
			.where("id", "=", args.fileQueueEntry.id)
			.execute();
	});
}

async function updateChangesInActiveVersion(args: {
	lix: Pick<Lix, "db" | "sqlite">;
	changes: Array<Change>;
}) {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const activeVersion = await trx
			.selectFrom("active_version")
			.innerJoin("version_v2", "active_version.version_id", "version_v2.id")
			.selectAll("version_v2")
			.executeTakeFirstOrThrow();

		const newChangeSet = await createChangeSet({
			lix: { ...args.lix, db: trx },
			changes: args.changes,
			parents: [{ id: activeVersion.change_set_id }],
		});
		await trx
			.updateTable("version_v2")
			.set({
				change_set_id: newChangeSet.id,
			})
			.where("id", "=", activeVersion.id)
			.execute();
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
