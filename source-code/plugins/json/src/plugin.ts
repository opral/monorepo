import type { Message, Variant, LanguageTag, InlangEnvironment, Plugin } from "@inlang/plugin"
import {
	throwIfInvalidOptions, type PluginOptions
} from "./options.js"
import { detectJsonSpacing, detectIsNested, replaceAll } from "./utilities.js"
import { flatten } from "flat"
import { ideExtensionConfig } from "./ideExtension/config.js"

/**
 * The spacing of the JSON files in this repository.
 *
 * @example
 *  { "/en.json" = 2 }
 */
const SPACING: Record<string, ReturnType<typeof detectJsonSpacing>> = {}

/**
 * The nesting the JSON files in this repository
 *
 * @example
 *  { "/en.json" = nested }
 */
const NESTED: Record<string, ReturnType<typeof detectIsNested>> = {}

/**
 * Whether a file has a new line at the end.
 *
 * @example
 * { "/en.json" = true }
 * { "/de.json" = false }
 */
const FILE_HAS_NEW_LINE: Record<string, boolean> = {}

/**
 * Defines the default spacing for JSON files.
 *
 * Takes the majority spacing of resource files in this repository to determine
 * the default spacing.
 */
function defaultSpacing() {
	const values = Object.values(SPACING)
	return (
		values
			.sort((a, b) => values.filter((v) => v === a).length - values.filter((v) => v === b).length)
			.pop() ?? 2 // if no default has been found -> 2
	)
}

/**
 * Defines the default nesting for JSON files.
 *
 * Takes the majority of nested/flatten resource files in this repository to determine
 * the default spacing.
 */
function defaultNesting() {
	const values = Object.values(NESTED)
	return (
		values
			.sort((a, b) => values.filter((v) => v === a).length - values.filter((v) => v === b).length)
			.pop() ?? false // if no default has been found -> false -> flatten
	)
}

let pluginOptions: PluginOptions | undefined = undefined
let pluginFs: InlangEnvironment["$fs"] | undefined = undefined

export const plugin: Plugin<PluginOptions> = {
	meta: {
		id: "inlang.plugin-json",
		displayName: { en: "JSON" },
		description: { en: "JSON plugin for inlang" },
		keywords: ["json", "generic"],
	},
	setup: ({ options, fs }) => {
		options.variableReferencePattern = options.variableReferencePattern || ["{{", "}}"]
		throwIfInvalidOptions(options),
		pluginOptions = options
		pluginFs = fs
		return {}
	},
	loadMessages: async ({ languageTags }) => {
		if (!pluginFs || !pluginOptions) throw new Error("Plugin not setup")
		return await loadMessages({
			fs: pluginFs,
			options: pluginOptions,
			languageTags,
		})
	},
	saveMessages: async ({ messages }) => {
		// return saveMessages({
		// 	fs: pluginFs,
		// 	options: pluginOptions,
		// 	messages,
		// })
	},
	addAppSpecificApi: ideExtensionConfig,
}
	
/**
 * Reading resources.
 */
async function loadMessages(args: {
	fs: InlangEnvironment["$fs"]
	options: PluginOptions
	languageTags: LanguageTag[]
}): Promise<Message[]> {
	const messages: Message[] = []
	for (const languageTag of args.languageTags) {
		if (typeof args.options.pathPattern !== "string") {
			for (const [prefix, path] of Object.entries(args.options.pathPattern)) {
				const messagesFromFile = await getFileToParse(
					path,
					NESTED[path.replace("{language}", languageTag)] ?? defaultNesting(),
					languageTag,
					args.fs,
				)
				for (const [key, value] of Object.entries(messagesFromFile)) {
					const prefixedKey = prefix + ":" + key
					addVariantToMessages(messages, prefixedKey, languageTag, value)
				}
			}
		} else {
			const messagesFromFile = await getFileToParse(
				args.options.pathPattern,
				NESTED[args.options.pathPattern.replace("{language}", languageTag)] ?? defaultNesting(),
				languageTag,
				args.fs,
			)
			for (const [key, value] of Object.entries(messagesFromFile)) {
				addVariantToMessages(messages, key, languageTag, value)
			}
		}
	}
	return messages
}

/**
 * Get the files that needs to be parsed.
 */
async function getFileToParse(
	path: string,
	isNested: boolean,
	language: string,
	fs: InlangEnvironment["$fs"],
): Promise<Record<string, string>> {
	const pathWithLanguage = path.replace("{language}", language)
	// get file, make sure that is not braking when the namespace doesn't exist in every language dir
	try {
		const file = await fs.readFile(pathWithLanguage, { encoding: "utf-8" })
		//analyse format of file
		SPACING[pathWithLanguage] = detectJsonSpacing(file as string)
		NESTED[pathWithLanguage] = detectIsNested(file as string)
		FILE_HAS_NEW_LINE[pathWithLanguage] = (file as string).endsWith("\n")

		const flattenedMessages = isNested
			? flatten(JSON.parse(file as string), {
					transformKey: function (key) {
						//replace dots in keys with unicode
						return replaceAll(key, ".", "u002E")
					},
			  })
			: JSON.parse(file as string)
		return flattenedMessages
	} catch (e) {
		// if the namespace doesn't exist for this dir -> continue
		if ((e as any).code === "FileNotFound" || (e as any).code === "ENOENT") {
			// file does not exist yet
			return {}
		}
		throw e
	}
}

/**
 * Add new item (message, variant) to the ast
 */
const addVariantToMessages = (
	messages: Message[],
	key: string,
	language: LanguageTag,
	value: string,
) => {
	const messageIndex = messages.findIndex((m) => m.id === key)
	if (messageIndex !== -1) {
		const variant: Variant = {
			match: {},
			pattern: parsePattern(value, pluginOptions!.variableReferencePattern),
		}
		// Check if the language exists in the body of the message
		if (!messages[messageIndex]?.body[language]) {
			messages[messageIndex]!.body[language]! = []
		}

		//push new variant
		messages[messageIndex]!.body[language]!.push(variant)
	} else {
		// message does not exist
		const message: Message = {
			id: key,
			expressions: [],
			selectors: [],
			body: {},
		}
		message.body[language] = [
			{
				match: {},
				pattern: parsePattern(value, pluginOptions!.variableReferencePattern),
			},
		]
		messages.push(message)
	}
}

/**
 * Parses a pattern.
 *
 * @example parseMessage("testId", "test", ["{{", "}}"])
 */
function parsePattern(
	text: string,
	variableReferencePattern: PluginOptions["variableReferencePattern"],
): Message["body"][LanguageTag][number]["pattern"] {
	// dependent on the variableReferencePattern, different regex
	// expressions are used for matching
	const placeholder = variableReferencePattern![1]
		? new RegExp(
				`(\\${variableReferencePattern![0]}[^\\${variableReferencePattern![1]}]+\\${
					variableReferencePattern![1]
				})`,
				"g",
		  )
		: new RegExp(`(${variableReferencePattern}\\w+)`, "g")
	const pattern: Message["body"][LanguageTag][number]["pattern"] = text
		.split(placeholder)
		.filter((element) => element !== "")
		.map((element) => {
			if (placeholder.test(element)) {
				return {
					type: "Expression",
					body: {
						type: "VariableReference",
						name: variableReferencePattern![1]
							? element.slice(
									variableReferencePattern![0].length,
									// negative index, removing the trailing pattern
									-variableReferencePattern![1].length,
							  )
							: element.slice(variableReferencePattern![0].length),
					},
				}
			} else {
				return {
					type: "Text",
					value: element,
				}
			}
		})

	return pattern
}

// /**
//  * Writing resources.
//  *
//  * @example writeResources({resources, settings, $fs})
//  */
// async function writeResources(
// 	args: Parameters<InlangConfig["writeResources"]>[0] & {
// 		settings: PluginSettingsWithDefaults
// 		$fs: InlangEnvironment["$fs"]
// 	},
// ): ReturnType<InlangConfig["writeResources"]> {
// 	for (const resource of args.resources) {
// 		const resourcePath = args.settings.pathPattern.replace("{language}", resource.languageTag.name)

// 		if (REPO_USES_WILDCARD_STRUCTURE === false) {
// 			await args.$fs.writeFile(
// 				resourcePath,
// 				serializeResource(
// 					resource,
// 					SPACING[resourcePath] ?? defaultSpacing(),
// 					FILE_HAS_NEW_LINE[resourcePath]!,
// 					args.settings.variableReferencePattern,
// 				),
// 			)
// 		} else if (REPO_USES_WILDCARD_STRUCTURE) {
// 			// just in case try to create a directory to not make file operations fail
// 			const [directoryPath] = resourcePath.split("/*.json")
// 			try {
// 				await args.$fs.readdir(directoryPath!)
// 			} catch {
// 				// directory doesn't exists
// 				await args.$fs.mkdir(directoryPath!)
// 			}

// 			//* Performance optimization in the future: Only iterate over the resource body once
// 			const filePaths = new Set(resource.body.map((message) => message.id.name!.split(".")[0]))

// 			for (const fileName of filePaths) {
// 				const filteredMessages = resource.body
// 					.filter((message: ast.Message) => message.id.name.startsWith(fileName!))
// 					.map((message: ast.Message) => {
// 						return {
// 							...message,
// 							id: {
// 								...message.id,
// 								name: message.id.name.replace(`${fileName}.`, ""),
// 							},
// 						}
// 					})
// 				const splitedResource: ast.Resource = {
// 					type: resource.type,
// 					languageTag: resource.languageTag,
// 					body: filteredMessages,
// 				}
// 				const path = resourcePath.replace("*", fileName!)
// 				await args.$fs.writeFile(
// 					path,
// 					serializeResource(
// 						splitedResource,
// 						SPACING[path] ?? defaultSpacing(),
// 						FILE_HAS_NEW_LINE[path]!,
// 						args.settings.variableReferencePattern,
// 					),
// 				)
// 			}
// 		} else {
// 			throw new Error("None-exhaustive if statement in writeResources")
// 		}
// 	}
// }