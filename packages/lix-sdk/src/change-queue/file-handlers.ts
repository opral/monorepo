import type { ChangeQueueEntry } from "../database/schema.js";
import type { DetectedChange } from "../plugin/lix-plugin.js";
import type { Lix } from "../lix/open-lix.js";
import { sql } from "kysely";
import { createChange } from "../change/create-change.js";

// start a new normalize path function that has the absolute minimum implementation.
function normalizePath(path: string) {
	if (!path.startsWith("/")) {
		return "/" + path;
	}
	return path;
}

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
		if (
			!(await glob({
				lix: args.lix,
				path: normalizePath(path),
				glob: "/" + plugin.detectChangesGlob,
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
		const currentAuthors = await trx
			.selectFrom("active_account")
			.selectAll()
			.execute();

		const currentVersion = await trx
			.selectFrom("current_version")
			.innerJoin("version", "current_version.id", "version.id")
			.selectAll()
			.executeTakeFirstOrThrow();

		await Promise.all(
			detectedChanges.map(async (detectedChange) => {
				await createChange({
					lix: { ...args.lix, db: trx },
					authors: currentAuthors,
					version: currentVersion,
					entityId: detectedChange.entity_id,
					fileId: args.changeQueueEntry.file_id,
					pluginKey: detectedChange.pluginKey,
					schemaKey: detectedChange.schema.key,
					snapshotContent: detectedChange.snapshot,
				});
			})
		);

		await trx
			.deleteFrom("change_queue")
			.where("id", "=", args.changeQueueEntry.id)
			.execute();
	});
}

export async function handleFileUpdate(args: {
	lix: Pick<Lix, "db" | "plugin" | "sqlite">;
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
		if (
			!(await glob({
				lix: args.lix,
				path: normalizePath(path),
				glob: "/" + plugin.detectChangesGlob,
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
		const currentAuthors = await trx
			.selectFrom("active_account")
			.selectAll()
			.execute();

		const currentVersion = await trx
			.selectFrom("current_version")
			.innerJoin("version", "current_version.id", "version.id")
			.selectAll()
			.executeTakeFirstOrThrow();

		await Promise.all(
			detectedChanges.map(async (detectedChange) => {
				await createChange({
					lix: { ...args.lix, db: trx },
					authors: currentAuthors,
					version: currentVersion,
					entityId: detectedChange.entity_id,
					fileId: args.changeQueueEntry.file_id,
					pluginKey: detectedChange.pluginKey,
					schemaKey: detectedChange.schema.key,
					snapshotContent: detectedChange.snapshot,
				});
			})
		);

		await trx
			.deleteFrom("change_queue")
			.where("id", "=", args.changeQueueEntry.id)
			.execute();
	});
}

export async function handleFileDelete(args: {
	lix: Pick<Lix, "db" | "plugin" | "sqlite">;
	changeQueueEntry: ChangeQueueEntry;
}): Promise<void> {
	const detectedChanges: Array<DetectedChange & { pluginKey: string }> = [];

	const plugins = await args.lix.plugin.getAll();

	const path = args.changeQueueEntry.path_before;

	if (path === null) {
		throw new Error("Before path is null for file deletion");
	}

	for (const plugin of plugins) {
		if (
			!(await glob({
				lix: args.lix,
				path: normalizePath(path),
				glob: "/" + plugin.detectChangesGlob,
			}))
		) {
			break;
		}

		if (plugin.detectChanges === undefined) {
			const error = new Error(
				"Plugin does not support detecting changes even though the glob matches."
			);
			console.error(error);
			throw error;
		}

		for (const change of await plugin.detectChanges({
			before: {
				id: args.changeQueueEntry.file_id,
				path,
				metadata: args.changeQueueEntry.metadata_before,
				data: args.changeQueueEntry.data_before!,
			},
			after: undefined,
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

		await Promise.all(
			detectedChanges.map(async (detectedChange) => {
				await createChange({
					lix: { ...args.lix, db: trx },
					authors: currentAuthors,
					version: currentVersion,
					entityId: detectedChange.entity_id,
					fileId: args.changeQueueEntry.file_id,
					pluginKey: detectedChange.pluginKey,
					schemaKey: detectedChange.schema.key,
					snapshotContent: null, // Snapshot is null for deletions
				});
			})
		);

		await trx
			.deleteFrom("change_queue")
			.where("id", "=", args.changeQueueEntry.id)
			.execute();
	});
}
