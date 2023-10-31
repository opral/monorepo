import type { NodeishFilesystemSubset, Plugin } from "@inlang/sdk"
import type { StorageSchema } from "./storageSchema.js"
import { displayName, description } from "../marketplace-manifest.json"
import { PluginSettings } from "./settings.js"
import { detectJsonFormatting } from "@inlang/detect-json-formatting"

export const pluginId = "plugin.inlang.messageFormat"

let stringifyWithFormatting: ReturnType<typeof detectJsonFormatting>

export const plugin: Plugin<{
	[pluginId]: PluginSettings
}> = {
	id: pluginId,
	displayName,
	description,
	settingsSchema: PluginSettings,
	loadMessages: async ({ settings, nodeishFs }) => {
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
	let previousPath = ""
	for (const path of dirname(args.path).split("/")) {
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

/**
 * Function extracted from https://www.npmjs.com/package/path-browserify
 */
function dirname(path: string) {
	if (path.length === 0) return "."
	let code = path.charCodeAt(0)
	const hasRoot = code === 47 /*/*/
	let end = -1
	let matchedSlash = true
	for (let i = path.length - 1; i >= 1; --i) {
		code = path.charCodeAt(i)
		if (code === 47 /*/*/) {
			if (!matchedSlash) {
				end = i
				break
			}
		} else {
			// We saw the first non-path separator
			matchedSlash = false
		}
	}

	if (end === -1) return hasRoot ? "/" : "."
	if (hasRoot && end === 1) return "//"
	return path.slice(0, end)
}
