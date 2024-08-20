import type { BundleNested, InlangPlugin, ResourceFile } from "@inlang/sdk2"
import { PluginSettings } from "./settings.js"
import { createMessage } from "./parse.js"

const pluginKey = "plugin.inlang.icu-messageformat-1"
export const plugin: InlangPlugin<{
	[pluginKey]: PluginSettings
}> = {
	key: pluginKey,
	settingsSchema: PluginSettings,

	toBeImportedFiles: async ({ settings, nodeFs }) => {
		const files: ResourceFile[] = []
		const pathPattern = settings["plugin.inlang.icu-messageformat-1"].pathPattern

		for (const locale of settings.locales) {
			const path = pathPattern.replace("{locale}", locale)
			const file = await nodeFs.readFile(path)
			files.push({
				path,
				content: file,
				pluginKey: pluginKey,
			})
		}

		return files
	},
	importFiles: ({ files, settings }) => {
		const bundles: Record<string, BundleNested> = {}
		const utf8 = new TextDecoder("utf-8")
		const pathPattern = settings["plugin.inlang.icu-messageformat-1"].pathPattern
		const [before, after] = pathPattern.split("{locale}") as [string, string]
		/**
		 * Everything before the locale. Doesn't have to be the full path
		 */
		const cleanBefore = before.replace(".", "").split("/").filter(Boolean).join("/") // remove ./, ../ and empty segments

		for (const file of files) {
			// find corresponding locale for file
			const withoutAfter = file.path.replace(after, "") // remove everything after {locale} from the file path
			const locale = withoutAfter.slice(
				withoutAfter.lastIndexOf(cleanBefore) + cleanBefore.length + 1
			)
			if (!settings.locales.includes(locale)) continue // fail?

			try {
				const jsonTxt = utf8.decode(file.content)
				const json = JSON.parse(jsonTxt)

				for (const [key, value] of Object.entries(json)) {
					if (typeof value !== "string") continue
					const message = createMessage({
						messageSource: value,
						bundleId: key,
						locale: locale,
					})

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

	exportFiles: ({ bundles, settings }) => {
		return []
	},
}
