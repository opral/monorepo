import type { LixPlugin } from "../plugin.js";
import { Kysely, ParseJSONResultsPlugin, sql } from "kysely";
import type { LixDatabase, LixFile } from "../schema.js";
import { commit } from "../commit.js";
import { v4 } from "uuid";
import {
	contentFromDatabase,
	createDialect,
	type SqliteDatabase,
} from "sqlite-wasm-kysely";

/**
 * Common setup between different lix environments.
 */
export async function openLix(args: {
	database: SqliteDatabase;
	/**
	 * Usecase are lix apps that define their own file format,
	 * like inlang (unlike a markdown, csv, or json plugin).
	 *
	 * (+) avoids separating app code from plugin code and
	 *     resulting bundling logic.
	 * (-) such a file format must always be opened with the
	 *     file format sdk. the file is not portable
	 *
	 * @example
	 *   const lix = await openLixInMemory({ blob: await newLixFile(), providePlugin: [myPlugin] })
	 */
	providePlugins?: LixPlugin[];
}) {
	const db = new Kysely<LixDatabase>({
		dialect: createDialect({ database: args.database }),
		plugins: [new ParseJSONResultsPlugin()],
	});

	const plugins = await loadPlugins(db);
	if (args.providePlugins && args.providePlugins.length > 0) {
		plugins.push(...args.providePlugins);
	}

	// TODO better api for awaiting pending promises
	const maybePendingPromises: Promise<any>[] = [];

	args.database.createFunction({
		name: "handle_file_change",
		arity: 6,
		// @ts-expect-error - dynamic function
		xFunc: (_, ...args) => {
			maybePendingPromises.push(
				handleFileChange({
					old: {
						id: args[0] as any,
						path: args[1] as any,
						data: args[2] as any,
					},
					neu: {
						id: args[3] as any,
						path: args[4] as any,
						data: args[5] as any,
					},
					plugins,
					db,
				}),
			);
			return;
		},
	});

	await sql`
	CREATE TEMP TRIGGER file_modified AFTER UPDATE ON file
	BEGIN
	  SELECT handle_file_change(OLD.id, OLD.path, OLD.data, NEW.id, NEW.path, NEW.data);
	END;
	`.execute(db);

	args.database.createFunction({
		name: "handle_file_insert",
		arity: 3,
		// @ts-expect-error - dynamic function
		xFunc: (_, id: any, path: any, data: any) => {
			maybePendingPromises.push(
				handleFileInsert({
					neu: {
						id,
						path,
						data,
					},
					plugins,
					db,
				}),
			);
			return;
		},
	});

	await sql`
	CREATE TEMP TRIGGER file_inserted AFTER INSERT ON file
	BEGIN
	  SELECT handle_file_insert(NEW.id, NEW.path, NEW.data);
	END;
	`.execute(db);

	return {
		db,
		toBlob: async () => {
			await Promise.all(maybePendingPromises);
			return new Blob([contentFromDatabase(args.database)]);
		},
		plugins,
		close: async () => {
			args.database.close();
			await db.destroy();
		},
		commit: (args: { userId: string; description: string }) => {
			return commit({ db, ...args });
		},
	};
}

async function loadPlugins(db: Kysely<LixDatabase>) {
	const pluginFiles = (
		await sql`
    SELECT * FROM file
    WHERE path GLOB 'lix/plugin/*'
  `.execute(db)
	).rows as unknown as LixFile[];

	const decoder = new TextDecoder("utf8");
	const plugins: LixPlugin[] = [];
	for (const plugin of pluginFiles) {
		const text = btoa(decoder.decode(plugin.data));
		const pluginModule = await import(
			/* @vite-ignore */ "data:text/javascript;base64," + text
		);
		plugins.push(pluginModule.default);
		if (pluginModule.default.setup) {
			await pluginModule.default.setup();
		}
	}
	return plugins as LixPlugin[];
}

// // TODO register on behalf of apps or leave it up to every app?
// //      - if every apps registers, components can be lazy loaded
// async function registerDiffComponents(plugins: LixPlugin[]) {
// 	for (const plugin of plugins) {
// 		for (const type in plugin.diffComponent) {
// 			const component = plugin.diffComponent[type]?.()
// 			const name = "lix-plugin-" + plugin.key + "-diff-" + type
// 			if (customElements.get(name) === undefined) {
// 				// @ts-ignore
// 				customElements.define(name, component)
// 			}
// 		}
// 	}
// }

async function getChangeHistory({
	atomId,
	depth,
	fileId,
	pluginKey,
	diffType,
	db,
}: {
	atomId: string;
	depth: number;
	fileId: string;
	pluginKey: string;
	diffType: string;
	db: Kysely<LixDatabase>;
}): Promise<any[]> {
	if (depth > 1) {
		throw new Error("depth > 1 not supported yet");
	}

	const { commit_id } = await db
		.selectFrom("ref")
		.select("commit_id")
		.where("name", "=", "current")
		.executeTakeFirstOrThrow();

	let nextCommitId = commit_id;
	let firstChange;
	while (!firstChange && nextCommitId) {
		const commit = await db
			.selectFrom("commit")
			.selectAll()
			.where("id", "=", nextCommitId)
			.executeTakeFirst();

		if (!commit) {
			break;
		}
		nextCommitId = commit.parent_id;

		firstChange = await db
			.selectFrom("change")
			.selectAll()
			.where("commit_id", "=", commit.id)
			.where((eb) => eb.ref("value", "->>").key("id"), "=", atomId)
			.where("plugin_key", "=", pluginKey)
			.where("file_id", "=", fileId)
			.where("type", "=", diffType)
			.executeTakeFirst();
	}

	const changes: any[] = [firstChange];

	// TODO: walk change parents until depth
	// await db
	// 	.selectFrom("change")
	// 	.select("id")
	// 	.where((eb) => eb.ref("value", "->>").key("id"), "=", atomId)
	// 	.where("type", "=", diffType)
	// 	.where("file_id", "=", fileId)
	// 	.where("plugin_key", "=", pluginKey)
	// 	.where("commit_id", "is not", null)
	// 	.executeTakeFirst()

	return changes;
}

async function handleFileChange(args: {
	old: LixFile;
	neu: LixFile;
	plugins: LixPlugin[];
	db: Kysely<LixDatabase>;
}) {
	const fileId = args.neu?.id ?? args.old?.id;

	for (const plugin of args.plugins) {
		const diffs = await plugin.diff?.file?.({
			old: args.old,
			neu: args.neu,
		});

		for (const diff of diffs ?? []) {
			// assume an insert or update operation as the default
			// if diff.neu is not present, it's a delete operation
			const value = diff.neu ?? diff.old;

			const previousUncomittedChange = await args.db
				.selectFrom("change")
				.selectAll()
				.where((eb) => eb.ref("value", "->>").key("id"), "=", value.id)
				.where("type", "=", diff.type)
				.where("file_id", "=", fileId)
				.where("plugin_key", "=", plugin.key)
				.where("commit_id", "is", null)
				.executeTakeFirst();

			// no uncommitted change exists
			if (previousUncomittedChange === undefined) {
				const parent = (
					await getChangeHistory({
						atomId: value.id,
						depth: 1,
						db: args.db,
						fileId,
						pluginKey: plugin.key,
						diffType: diff.type,
					})
				)[0];

				await args.db
					.insertInto("change")
					.values({
						id: v4(),
						type: diff.type,
						file_id: fileId,
						operation: diff.operation,
						parent_id: parent?.id,
						plugin_key: plugin.key,
						// @ts-expect-error - database expects stringified json
						value: JSON.stringify(value),
						meta: JSON.stringify(diff.meta),
					})
					.execute();
				continue;
			}

			const previousCommittedChange = await args.db
				.selectFrom("change")
				.selectAll()
				.where((eb) => eb.ref("value", "->>").key("id"), "=", value.id)
				.where("type", "=", diff.type)
				.where("file_id", "=", fileId)
				.where("commit_id", "is not", null)
				.where("plugin_key", "=", plugin.key)
				.innerJoin("commit", "commit.id", "change.commit_id")
				.orderBy("commit.created desc")
				.executeTakeFirst();

			// working change exists but is identical to previously committed change
			if (previousCommittedChange) {
				const diffPreviousCommittedChange = await plugin.diff?.[diff.type]?.({
					// @ts-expect-error - dynamic type
					old: previousCommittedChange.value,
					// @ts-expect-error - dynamic type
					neu: diff.neu,
				});

				if (diffPreviousCommittedChange?.length === 0) {
					// drop the change because it's identical
					await args.db
						.deleteFrom("change")
						.where((eb) => eb.ref("value", "->>").key("id"), "=", value.id)
						.where("type", "=", diff.type)
						.where("file_id", "=", fileId)
						.where("plugin_key", "=", plugin.key)
						.where("commit_id", "is", null)
						.execute();
					continue;
				}
			}

			// working change exists but is different from previously committed change
			// -> update the working change
			// overwrite the (uncomitted) change
			// to avoid (potentially) saving every keystroke change
			await args.db
				.updateTable("change")
				.where((eb) => eb.ref("value", "->>").key("id"), "=", value.id)
				.where("type", "=", diff.type)
				.where("file_id", "=", fileId)
				.where("plugin_key", "=", plugin.key)
				.where("commit_id", "is", null)
				.set({
					id: v4(),
					operation: diff.operation,
					// @ts-expect-error - database expects stringified json
					value: JSON.stringify(value),
					meta: JSON.stringify(diff.meta),
				})
				.execute();
		}
	}
}

// creates initial changes for new files
async function handleFileInsert(args: {
	neu: LixFile;
	plugins: LixPlugin[];
	db: Kysely<LixDatabase>;
}) {
	for (const plugin of args.plugins) {
		const diffs = await plugin.diff?.file?.({
			old: undefined,
			neu: args.neu,
		});
		for (const diff of diffs ?? []) {
			const value = diff.neu ?? diff.old;

			await args.db
				.insertInto("change")
				.values({
					id: v4(),
					type: diff.type,
					file_id: args.neu.id,
					plugin_key: plugin.key,
					operation: diff.operation,
					// @ts-expect-error - database expects stringified json
					value: JSON.stringify(value),
					meta: JSON.stringify(diff.meta),
				})
				.execute();
		}
	}
}
