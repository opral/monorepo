import type { NodeishFilesystemSubset, Plugin } from "@inlang/sdk"
import type { StorageSchema } from "./storageSchema.js"
import { displayName, description } from "../marketplace-manifest.json"
import { parse as validatePluginSettings } from "valibot"
import { PluginSettings } from "./settings.js"
import { detectJsonFormatting } from "@inlang/detect-json-formatting"
import parsePath from "path-parse"

export const pluginId = "plugin.inlang.messageFormat"

let stringifyWithFormatting: ReturnType<typeof detectJsonFormatting>

export const plugin: Plugin<{
	[pluginId]: PluginSettings
}> = {
	id: pluginId,
	displayName,
	description,
	loadMessages: async ({ settings, nodeishFs }) => {
		validatePluginSettings(PluginSettings, settings["plugin.inlang.messageFormat"])

		try {
			const file = await nodeishFs.readFile(settings["plugin.inlang.messageFormat"].filePath, {
				encoding: "utf-8",
			})
			stringifyWithFormatting = detectJsonFormatting(file)
			return (JSON.parse(file) as StorageSchema)["data"]
		} catch (error) {
			// file does not exist. create it.
			if ((error as any)?.code === "ENOENT") {
				await createFile({ path: settings["plugin.inlang.messageFormat"].filePath, nodeishFs })
				return []
			}
			// unknown error
			throw error
		}
	},
	saveMessages: async ({ settings, nodeishFs, messages }) => {
		return nodeishFs.writeFile(
			settings["plugin.inlang.messageFormat"].filePath,
			//! - assumes that all messages are always passed to the plugin
			//  - sorts alphabetically to minimize git diff's and merge conflicts
			stringifyWithFormatting({
				$schema: "https://inlang.com/schema/inlang-message-format",
				data: messages.sort((a, b) => a.id.localeCompare(b.id)),
			} satisfies StorageSchema)
		)
	},
}

const createFile = async (args: { path: string; nodeishFs: NodeishFilesystemSubset }) => {
	const parsed = parsePath(args.path)
	let previousPath = ""
	for (const path of parsed.dir.split("/")) {
		try {
			// not using { recursive: true } because the option is flacky
			// and is implemented differently in filesystem implementations
			await args.nodeishFs.mkdir(previousPath + "/" + path)
			previousPath += "/" + path
		} catch {
			// we assume that the directory already exists
			continue
		}
	}
	await args.nodeishFs.writeFile(
		args.path,
		JSON.stringify(
			{
				$schema: "https://inlang.com/schema/inlang-message-format",
				data: [],
			} satisfies StorageSchema,
			undefined,
			// beautify the file
			"\t"
		)
	)
}
