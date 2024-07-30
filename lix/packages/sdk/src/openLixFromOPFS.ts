/* eslint-disable unicorn/no-null */
import { Kysely, ParseJSONResultsPlugin } from "kysely"
import { SQLocalKysely } from "sqlocal/kysely"
import type { Database, LixFile } from "./schema.js"
import type { LixPlugin } from "./plugin.js"
import { commit } from "./commit.js"
import { v4 } from "uuid"

/**
 *
 */
export async function openLixFromOpfs(path: string) {
	const { dialect, sql, createCallbackFunction } = new SQLocalKysely(path)

	const db = new Kysely<Database>({
		dialect,
		plugins: [new ParseJSONResultsPlugin()],
	})

	const plugins = await loadPlugins(sql)

	await createCallbackFunction("fileModified", (fileId, oldBlob, newBlob) =>
		handleFileChange({
			fileId,
			oldBlob,
			newBlob,
			plugins,
			db,
		})
	)

	await sql`
  CREATE TEMP TRIGGER file_modified AFTER UPDATE ON File
  BEGIN
    SELECT fileModified(NEW.id, OLD.blob, NEW.blob);
  END;
  `

	await createCallbackFunction("fileInserted", (fileId, newBlob) =>
		handleFileInsert({
			fileId,
			newBlob,
			plugins,
			db,
		})
	)

	await sql`
  CREATE TEMP TRIGGER file_inserted AFTER INSERT ON File
  BEGIN
    SELECT fileInserted(NEW.id, NEW.blob);
  END;
  `

	await registerDiffComponents(plugins)

	return {
		db,
		sql,
		plugins,
		commit: (args: { userId: string; description: string }) => {
			return commit({ db, ...args })
		},
	}
}

async function loadPlugins(sql: any) {
	const pluginFiles = await sql`
    SELECT * FROM file
    WHERE path GLOB 'lix/plugin/*'
  `
	const decoder = new TextDecoder("utf8")
	const plugins: LixPlugin[] = []
	for (const plugin of pluginFiles) {
		const text = btoa(decoder.decode(plugin.blob))
		const pluginModule = await import("data:text/javascript;base64," + text)
		plugins.push(pluginModule.default)
		if (pluginModule.default.setup) {
			await pluginModule.default.setup()
		}
	}
	return plugins as LixPlugin[]
}

// TODO register on behalf of apps or leave it up to every app?
//      - if every apps registers, components can be lazy loaded
async function registerDiffComponents(plugins: LixPlugin[]) {
	for (const plugin of plugins) {
		for (const type in plugin.diffComponent) {
			const component = plugin.diffComponent[type]?.()
			const name = "lix-plugin-" + plugin.key + "-diff-" + type
			if (customElements.get(name) === undefined) {
				// @ts-ignore
				customElements.define(name, component)
			}
		}
	}
}

async function handleFileChange(args: {
	fileId: LixFile["id"]
	oldBlob: LixFile["blob"]
	newBlob: LixFile["blob"]
	plugins: LixPlugin[]
	db: Kysely<Database>
}) {
	for (const plugin of args.plugins) {
		const diffs = await plugin.diff?.file?.({
			old: args.oldBlob,
			neu: args.newBlob,
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
	newBlob: LixFile["blob"]
	plugins: LixPlugin[]
	db: Kysely<Database>
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
