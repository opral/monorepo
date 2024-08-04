import { type Lix } from "@lix-js/sdk"
import type { InlangPlugin, ResourceFile } from "../plugin/schema.js"
import type { ProjectSettings } from "../schema/settings.js"
import { contentFromDatabase, type SqliteDatabase } from "sqlite-wasm-kysely"
import { initKysely } from "../database/initKysely.js"
import { initHandleSaveToLixOnChange } from "./initHandleSaveToLixOnChange.js"
import { importPlugins } from "../plugin/importPlugins.js"

/**
 * Common load project logic.
 */
export async function loadProject(args: {
	sqlite: SqliteDatabase
	lix: Lix
	/**
	 * For testing purposes only.
	 *
	 * @example
	 *   const project = await loadProject({ _mockPlugins: { "my-plugin": InlangPlugin } })
	 *
	 */
	_mockPlugins?: Record<string, InlangPlugin>
}) {
	const db = initKysely({ sqlite: args.sqlite })

	const settingsFile = await args.lix.db
		.selectFrom("file")
		.select("data")
		.where("path", "=", "/settings.json")
		.executeTakeFirstOrThrow()

	let settings = JSON.parse(new TextDecoder().decode(settingsFile.data)) as ProjectSettings

	const { plugins, errors: pluginErrors } = await importPlugins({
		settings,
		mockPlugins: args._mockPlugins,
	})

	await initHandleSaveToLixOnChange({ sqlite: args.sqlite, db, lix: args.lix })

	return {
		db,
		plugins: {
			get: () => plugins,
			subscribe: () => {
				throw new Error("Not implemented")
			},
		},
		errors: {
			get: () => pluginErrors,
			subscribe: () => {
				throw new Error("Not implemented")
			},
		},
		importFiles: (args: { pluginKey: InlangPlugin["key"]; files: ResourceFile }) => {
			args
			throw new Error("Not implemented")
		},
		exportFiles: (args: { pluginKey: InlangPlugin["key"] }) => {
			args
			throw new Error("Not implemented")
		},
		settings: {
			get: () => settings,
			set: async (newSettings: ProjectSettings) => {
				await args.lix.db
					.updateTable("file")
					.where("path", "is", "/settings.json")
					.set({
						data: await new Blob([JSON.stringify(newSettings, undefined, 2)]).arrayBuffer(),
					})
					.execute()
				// if successful, update local settings
				settings = newSettings
			},
			subscribe: () => {
				throw new Error("Not implemented")
			},
		},
		close: async () => {
			args.sqlite.close()
			await db.destroy()
			await args.lix.close()
		},
		toBlob: async () => {
			const inlangDbContent = contentFromDatabase(args.sqlite)
			// flush db to lix
			await args.lix.db
				.updateTable("file")
				.where("path", "is", "/db.sqlite")
				.set({
					data: inlangDbContent,
				})
				.execute()
			return args.lix.toBlob()
		},
		lix: args.lix,
	}
}
