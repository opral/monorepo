import type { LanguageTag, Message, NodeishFilesystemSubset, Plugin } from "@inlang/sdk"
import type { StorageSchema } from "./storageSchema.js"
import { PluginSettings } from "./settings.js"
import { serializeMessage } from "./parsing/serializeMessage.js"
import { parseMessage } from "./parsing/parseMessage.js"

import _debug from "debug"
const debug = _debug("sdk:persistence")

export const pluginId = "plugin.sdk.persistence"

export const plugin: Plugin<{
	[pluginId]: PluginSettings
}> = {
	id: pluginId,
	displayName: "sdk-persistence",
	description: "plugin.sdk.persistence stores messages in the project folder.",
	settingsSchema: PluginSettings,
	loadMessages: async ({ settings, nodeishFs }) => {
		const result: Record<string, Message> = {}

		debug("loadMessages", settings[pluginId]?.pathPattern, settings.languageTags)

		for (const tag of settings.languageTags) {
			try {
				const file = await nodeishFs.readFile(
					settings[pluginId].pathPattern.replace("{languageTag}", tag),
					{
						encoding: "utf-8",
					}
				)
				const json = JSON.parse(file)
				for (const key in json) {
					if (key === "$schema") {
						continue
					}
					// message already exists, add the variants
					else if (result[key]) {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						result[key]!.variants = [
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							...result[key]!.variants,
							...parseMessage({ key, value: json[key], languageTag: tag }).variants,
						]
					}
					// message does not exist yet, create it
					else {
						result[key] = parseMessage({ key, value: json[key], languageTag: tag })
					}
				}
			} catch (error) {
				// TODO: check if file exists instead of catching error
				if ((error as any)?.code !== "ENOENT") {
					debug("loadMessages", tag, error)
					throw error
				}
			}
		}
		return Object.values(result)
	},
	saveMessages: async ({ settings, nodeishFs, messages }) => {
		const result: Record<LanguageTag, Record<string, string>> = {}

		debug("saveMessages", settings[pluginId]?.pathPattern, settings.languageTags)

		try {
			for (const message of messages) {
				const serialized = serializeMessage(message)
				for (const [languageTag, value] of Object.entries(serialized)) {
					if (result[languageTag] === undefined) {
						result[languageTag] = {}
					}
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					result[languageTag]![message.id] = value
				}
			}
			for (const [languageTag, messages] of Object.entries(result)) {
				const path = settings[pluginId].pathPattern.replace("{languageTag}", languageTag)
				await createDirectoryIfNotExits({ path, nodeishFs })
				await nodeishFs.writeFile(
					settings[pluginId].pathPattern.replace("{languageTag}", languageTag),
					// 2 spaces indentation
					((data: object) => JSON.stringify(data, undefined, 2))({
						...messages,
					} satisfies StorageSchema)
				)
			}
		} catch (error) {
			debug("saveMessages", error)
		}
	},
}

const createDirectoryIfNotExits = async (args: {
	path: string
	nodeishFs: NodeishFilesystemSubset
}) => {
	try {
		await args.nodeishFs.mkdir(dirname(args.path), { recursive: true })
	} catch {
		// assume that the directory already exists
	}
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
