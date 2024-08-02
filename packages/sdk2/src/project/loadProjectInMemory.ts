import { openLixInMemory } from "@lix-js/sdk"
import type { InlangPlugin2, ResourceFile } from "../plugin/schema.js"
import type { ProjectSettings } from "../schema/settings.js"
import { contentFromDatabase, createInMemoryDatabase, importDatabase } from "sqlite-wasm-kysely"
import { initKysely } from "../database/initKysely.js"
import { initHandleSaveToLixOnChange } from "./initHandleSaveToLixOnChange.js"

/**
 *
 */
export async function loadProjectInMemory(args: { blob: Blob }) {
	const lix = await openLixInMemory({ blob: args.blob })
	const dbFile = await lix.db
		.selectFrom("file")
		.select("data")
		.where("path", "=", "/db.sqlite")
		.executeTakeFirstOrThrow()

	const sqlite = await createInMemoryDatabase({})
	importDatabase({ db: sqlite, content: new Uint8Array(dbFile.data) })

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
		plugins: [] as InlangPlugin2[],
		importFiles: (args: { pluginKey: InlangPlugin2["key"]; files: ResourceFile }) => {
			args
			throw new Error("Not implemented")
		},
		exportFiles: (args: { pluginKey: InlangPlugin2["key"] }) => {
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
			// flush in-memory db to lix
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
