import { type Lix } from "@lix-js/sdk"
import type { InlangPlugin, ResourceFile } from "../plugin/type.js"
import type { ProjectSettings } from "../schema/settings.js"
import { contentFromDatabase, type SqliteDatabase } from "sqlite-wasm-kysely"
import { initKysely } from "../database/initKysely.js"
import { initHandleSaveToLixOnChange } from "./initHandleSaveToLixOnChange.js"

/**
 * Common load project logic.
 */
export async function loadProject({ sqlite, lix }: { sqlite: SqliteDatabase; lix: Lix }) {
	const db = initKysely({ sqlite })

	const settingsFile = await lix.db
		.selectFrom("file")
		.select("data")
		.where("path", "=", "/settings.json")
		.executeTakeFirstOrThrow()

	let settings = JSON.parse(new TextDecoder().decode(settingsFile.data)) as ProjectSettings

	await initHandleSaveToLixOnChange({ sqlite, db, lix })

	return {
		db,
		plugins: [] as InlangPlugin[],
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
				await lix.db
					.updateTable("file")
					.where("path", "is", "/settings.json")
					.set({
						data: await new Blob([JSON.stringify(newSettings, undefined, 2)]).arrayBuffer(),
					})
					.execute()
				// if successful, update local settings
				settings = newSettings
			},
		},
		close: async () => {
			sqlite.close()
			await db.destroy()
			await lix.close()
		},
		toBlob: async () => {
			const inlangDbContent = contentFromDatabase(sqlite)
			// flush db to lix
			await lix.db
				.updateTable("file")
				.where("path", "is", "/db.sqlite")
				.set({
					data: inlangDbContent,
				})
				.execute()
			return lix.toBlob()
		},
		lix,
	}
}
