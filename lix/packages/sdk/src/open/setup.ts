import type { LixPlugin } from "../plugin.js"
import { Kysely, ParseJSONResultsPlugin, sql } from "kysely"
import type { LixDatabase, LixFile } from "../schema.js"
import { commit } from "../commit.js"
import { v4 } from "uuid"
import { contentFromDatabase, createDialect, type SqliteDatabase } from "sqlite-wasm-kysely"

/**
 * Common setup between different lix environments.
 */
export async function setup(args: { database: SqliteDatabase }) {
	const db = new Kysely<LixDatabase>({
		dialect: createDialect({ database: args.database }),
		plugins: [new ParseJSONResultsPlugin()],
	})

	const plugins = await loadPlugins(db)

	args.database.createFunction({
		name: "handle_file_change",
		arity: 3,
		// @ts-expect-error - dynamic function
		xFunc: (_, fileId: any, oldData: any, neuData: any) => {
			handleFileChange({
				fileId,
				oldData,
				neuData,
				plugins,
				db,
			})
			return
		},
	})

	await sql`
	CREATE TEMP TRIGGER file_modified AFTER UPDATE ON file
	BEGIN
	  SELECT handle_file_change(NEW.id, OLD.data, NEW.data);
	END;
	`.execute(db)

	args.database.createFunction({
		name: "handle_file_insert",
		arity: 2,
		// @ts-expect-error - dynamic function
		xFunc: (_, fileId: any, newBlob: any) => {
			handleFileInsert({
				fileId,
				newBlob,
				plugins,
				db,
			})
			return
		},
	})

	await sql`
	CREATE TEMP TRIGGER file_inserted AFTER INSERT ON file
	BEGIN
	  SELECT handle_file_insert(NEW.id, NEW.blob);
	END;
	`.execute(db)

	return {
		db,
		toBlob: () => new Blob([contentFromDatabase(args.database)]),
		plugins,
		commit: (args: { userId: string; description: string }) => {
			return commit({ db, ...args })
		},
	}
}

async function loadPlugins(db: Kysely<LixDatabase>) {
	const pluginFiles = (
		await sql`
    SELECT * FROM file
    WHERE path GLOB 'lix/plugin/*'
  `.execute(db)
	).rows as unknown as LixFile[]

	const decoder = new TextDecoder("utf8")
	const plugins: LixPlugin[] = []
	for (const plugin of pluginFiles) {
		const text = btoa(decoder.decode(plugin.data))
		const pluginModule = await import(/* @vite-ignore */ "data:text/javascript;base64," + text)
		plugins.push(pluginModule.default)
		if (pluginModule.default.setup) {
			await pluginModule.default.setup()
		}
	}
	return plugins as LixPlugin[]
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

async function handleFileChange(args: {
	fileId: LixFile["id"]
	oldData: LixFile["data"]
	neuData: LixFile["data"]
	plugins: LixPlugin[]
	db: Kysely<LixDatabase>
}) {
	for (const plugin of args.plugins) {
		const diffs = await plugin.diff?.file?.({
			old: args.oldData,
			neu: args.neuData,
		})
		for (const diff of diffs ?? []) {
			const previousUncomittedChange = await args.db
				.selectFrom("change")
				.selectAll()
				.where((eb) => eb.ref("value", "->>").key("id"), "=", diff.value.id)
				.where("type", "=", diff.type)
				.where("file_id", "=", args.fileId)
				.where("plugin_key", "=", plugin.key)
				.where("commit_id", "is", null)
				.executeTakeFirst()

			// no uncommitted change exists
			if (previousUncomittedChange === undefined) {
				await args.db
					.insertInto("change")
					.values({
						id: v4(),
						type: diff.type,
						file_id: args.fileId,
						plugin_key: plugin.key,
						// @ts-expect-error - database expects stringified json
						value: JSON.stringify(diff.value),
						meta: JSON.stringify(diff.meta),
					})
					.execute()
				continue
			}

			const previousCommittedChange = await args.db
				.selectFrom("change")
				.selectAll()
				.where((eb) => eb.ref("value", "->>").key("id"), "=", diff.value.id)
				.where("type", "=", diff.type)
				.where("file_id", "=", args.fileId)
				.where("commit_id", "is not", null)
				.where("plugin_key", "=", plugin.key)
				.innerJoin("commit", "commit.id", "change.commit_id")
				.orderBy("commit.zoned_date_time desc")
				.executeTakeFirst()

			// working change exists but is identical to previously committed change
			if (previousCommittedChange) {
				const diffPreviousCommittedChange = await plugin.diff?.[diff.type]?.({
					// @ts-expect-error - dynamic type
					old: previousCommittedChange.value,
					// @ts-expect-error - dynamic type
					neu: diff.value,
				})
				if (diffPreviousCommittedChange?.length === 0) {
					// drop the change because it's identical
					await args.db
						.deleteFrom("change")
						.where((eb) => eb.ref("value", "->>").key("id"), "=", diff.value.id)
						.where("type", "=", diff.type)
						.where("file_id", "=", args.fileId)
						.where("plugin_key", "=", plugin.key)
						.where("commit_id", "is", null)
						.execute()
					continue
				}
			}

			// working change exists but is different from previously committed change
			// -> update the working change
			// overwrite the (uncomitted) change
			// to avoid (potentially) saving every keystroke change
			await args.db
				.updateTable("change")
				.where((eb) => eb.ref("value", "->>").key("id"), "=", diff.value.id)
				.where("type", "=", diff.type)
				.where("file_id", "=", args.fileId)
				.where("plugin_key", "=", plugin.key)
				.where("commit_id", "is", null)
				.set({
					id: v4(),
					// @ts-expect-error - database expects stringified json
					value: JSON.stringify(diff.value),
					meta: JSON.stringify(diff.meta),
				})
				.execute()
		}
	}
}

// creates initial commit
async function handleFileInsert(args: {
	fileId: LixFile["id"]
	newBlob: LixFile["data"]
	plugins: LixPlugin[]
	db: Kysely<LixDatabase>
}) {
	for (const plugin of args.plugins) {
		const diffs = await plugin.diff?.file?.({
			old: undefined,
			neu: args.newBlob,
		})
		for (const diff of diffs ?? []) {
			await args.db
				.insertInto("change")
				.values({
					id: v4(),
					type: diff.type,
					file_id: args.fileId,
					plugin_key: plugin.key,
					// @ts-expect-error - database expects stringified json
					value: JSON.stringify(diff.value),
					meta: JSON.stringify(diff.meta),
				})
				.execute()
		}
		// commit changes for the file
		args.db.transaction().execute(async () => {
			const commit = await args.db
				.insertInto("commit")
				.values({
					id: v4(),
					user_id: "system",
					// todo - use zoned datetime
					zoned_date_time: new Date().toISOString(),
					description: "initial commit",
				})
				.returning("id")
				.executeTakeFirstOrThrow()

			return await args.db
				.updateTable("change")
				.where("commit_id", "is", null)
				.where("file_id", "=", args.fileId)
				.set({
					commit_id: commit.id,
				})
				.execute()
		})
	}
}
