import type { BundleNested, InlangPlugin, ResourceFile } from "@inlang/sdk2"
import { PluginSettings } from "./settings.js"
import { createMessage } from "./parse.js"

const importerKey = "importer.inlang.icu-messageformat-1"
export const importer: InlangPlugin<typeof importerKey, typeof PluginSettings> = {
	key: importerKey,
	settingsSchema: PluginSettings,

	toBeImportedFiles: async ({ settings, nodeFs }) => {
		const files: ResourceFile[] = []

		const folderPath = settings["importer.inlang.icu-messageformat-1"].messagesFolderPath
		const entries = await nodeFs.readdir(folderPath)

		for (const entry of entries) {
			// if entry is called {locale}.json
			if (!entry.endsWith(".json")) continue
			const locale = entry.slice(0, -5).toLowerCase() // remove .json
			if (!settings.locales.includes(locale)) continue // unknown locale

			const path = `${folderPath}/${entry}`
			const file = await nodeFs.readFile(path)
			files.push({
				path,
				content: file,
				pluginKey: importerKey,
			})
		}

		return files
	},
	importFiles: ({ files }) => {
		const bundles: Record<string, BundleNested> = {}
		const utf8 = new TextDecoder("utf-8")

		for (const file of files) {
			const locale = file.path.slice(file.path.lastIndexOf("/") + 1, -5) // remove .json
			try {
				const jsonTxt = utf8.decode(file.content)
				const json = JSON.parse(jsonTxt)

				for (const [key, value] of Object.entries(json)) {
					if (typeof value !== "string") continue
					const message = createMessage(value, key, locale)

					const bundle = bundles[message.bundleId] ?? {
						id: message.bundleId,
						alias: {},
						messages: [],
					}
					bundle.messages.push(message)
					bundles[message.bundleId] = bundle
				}
			} catch (e) {
				// asd
			}
		}

		return { bundles: Object.values(bundles) }
	},
}
