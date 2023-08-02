import {
	type Message,
	type Variant,
	type LanguageTag,
	type InlangEnvironment,
	type Plugin,
	getVariant,
} from "@inlang/plugin"
import { throwIfInvalidOptions, type PluginOptions } from "./options.js"
import { detectJsonSpacing, detectIsNested, replaceAll } from "./utilities.js"
import { ideExtensionConfig } from "./ideExtension/config.js"
import { flatten, unflatten } from "flat"

/**
 * The spacing of the JSON files in this repository.
 *
 * @example
 *  { "/en.json" = 2 }
 */
let SPACING: Record<string, ReturnType<typeof detectJsonSpacing>> = {}

/**
 * The nesting the JSON files in this repository
 *
 * @example
 *  { "/en.json" = nested }
 */
let NESTED: Record<string, ReturnType<typeof detectIsNested>> = {}

/**
 * Whether a file has a new line at the end.
 *
 * @example
 * { "/en.json" = true }
 * { "/de.json" = false }
 */
let FILE_HAS_NEW_LINE: Record<string, boolean> = {}

/**
 * pluginOptions that are saved in plugin State (available for plugin functions)
 */
let pluginOptions: PluginOptions | undefined = undefined

/**
 * fileSystem that is saved in plugin State (available for plugin functions)
 */
let pluginFs: InlangEnvironment["$fs"] | undefined = undefined

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

export const plugin: Plugin<PluginOptions> = {
	meta: {
		id: "inlang.plugin-i18next",
		displayName: { en: "i18next" },
		description: { en: "i18next plugin for inlang" },
		keywords: ["i18next", "react", "nextjs"],
	},
	setup: ({ options, fs }) => {
		options.variableReferencePattern = options.variableReferencePattern || ["{{", "}}"]
		throwIfInvalidOptions(options)
		pluginOptions = options
		pluginFs = fs
		SPACING = {}
		NESTED = {}
		FILE_HAS_NEW_LINE = {}
		return {}
	},
	loadMessages: async ({ languageTags }) => {
		if (!pluginFs || !pluginOptions) throw new Error("Plugin not setup")
		return loadMessages({
			fs: pluginFs,
			options: pluginOptions,
			languageTags,
		})
	},
	saveMessages: async ({ messages }) => {
		return saveMessages({
			fs: pluginFs!,
			options: pluginOptions!,
			messages,
		})
	},
	addAppSpecificApi: ideExtensionConfig(pluginOptions!),
}

/**
 * Load messages
 *
 * @example const messages = await loadMessages({ fs, options, languageTags })
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
				const messagesFromFile = await getFileToParse(path, languageTag, args.fs)
				for (const [key, value] of Object.entries(messagesFromFile)) {
					const prefixedKey = prefix + ":" + replaceAll(key, "u002E", ".")
					addVariantToMessages(messages, prefixedKey, languageTag, value)
				}
			}
		} else {
			const messagesFromFile = await getFileToParse(args.options.pathPattern, languageTag, args.fs)
			for (const [key, value] of Object.entries(messagesFromFile)) {
				addVariantToMessages(messages, replaceAll(key, "u002E", "."), languageTag, value)
			}
		}
	}
	//console.log(messages)
	return messages
}

/**
 * Get file to parse
 *
 * To get files and throw if files are not there. Also handles the flattening for nested files
 *
 * @example const storedMessages = await getFileToParse(path, isNested, languageTag, fs)
 */
async function getFileToParse(
	path: string,
	languageTag: string,
	fs: InlangEnvironment["$fs"],
): Promise<Record<string, string>> {
	const pathWithLanguage = path.replace("{languageTag}", languageTag)
	// get file, make sure that is not braking when the namespace doesn't exist in every languageTag dir
	try {
		const file = await fs.readFile(pathWithLanguage, { encoding: "utf-8" })
		//analyse format of file
		SPACING[pathWithLanguage] = detectJsonSpacing(file as string)
		NESTED[pathWithLanguage] = detectIsNested(file as string)
		FILE_HAS_NEW_LINE[pathWithLanguage] = (file as string).endsWith("\n")
		const flattenedMessages = NESTED[pathWithLanguage]
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
 *
 * @example addVariantToMessages(messages, key, languageTag, value)
 */
const addVariantToMessages = (
	messages: Message[],
	key: string,
	languageTag: LanguageTag,
	value: string,
) => {
	const messageIndex = messages.findIndex((m) => m.id === key)
	if (messageIndex !== -1) {
		const variant: Variant = {
			match: {},
			pattern: parsePattern(value, pluginOptions!.variableReferencePattern),
		}
		// Check if the languageTag exists in the body of the message
		if (!messages[messageIndex]?.body[languageTag]) {
			messages[messageIndex]!.body[languageTag]! = []
		}

		//push new variant
		messages[messageIndex]!.body[languageTag]!.push(variant)
	} else {
		// message does not exist
		const message: Message = {
			id: key,
			expressions: [],
			selectors: [],
			body: {},
		}
		message.body[languageTag] = [
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
 * @example parsePattern("Hello {{name}}!", ["{{", "}}"])
 */
function parsePattern(
	text: string,
	variableReferencePattern: PluginOptions["variableReferencePattern"],
): Variant["pattern"] {
	// dependent on the variableReferencePattern, different regex
	// expressions are used for matching
	const expression = variableReferencePattern![1]
		? new RegExp(
				`(\\${variableReferencePattern![0]}[^\\${variableReferencePattern![1]}]+\\${
					variableReferencePattern![1]
				})`,
				"g",
		  )
		: new RegExp(`(${variableReferencePattern}\\w+)`, "g")
	const pattern: Variant["pattern"] = text
		.split(expression)
		.filter((element) => element !== "")
		.map((element) => {
			if (expression.test(element)) {
				return {
					type: "Expression",
					body: {
						type: "VariableReference",
						name: variableReferencePattern![1]
							? element.slice(
									variableReferencePattern![0]!.length,
									// negative index, removing the trailing pattern
									-variableReferencePattern![1].length,
							  )
							: element.slice(variableReferencePattern![0]!.length),
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

/**
 * Save messages
 *
 * @example await saveMessages({ fs, options, messages })
 */
async function saveMessages(args: {
	fs: InlangEnvironment["$fs"]
	options: PluginOptions
	messages: Message[]
}) {
	if (typeof args.options.pathPattern === "object") {
		// with namespaces
		const storage: Record<
			LanguageTag,
			Record<string, Record<Message["id"], Variant["pattern"]>>
		> = {}
		for (const message of args.messages) {
			for (const languageTag of Object.keys(message.body)) {
				const prefix: string = message.id.includes(":")
					? message.id.split(":")[0]!
					: // TODO remove default namespace functionallity, add better parser
					  Object.keys(args.options.pathPattern)[0]!
				const resolvedId = message.id.replace(prefix + ":", "")
				const serializedPattern: Variant["pattern"] = getVariant(message, {
					languageTag: languageTag,
				}).data!

				storage[languageTag] ??= {}
				storage[languageTag]![prefix] ??= {}
				storage[languageTag]![prefix]![resolvedId] = serializedPattern
			}
		}
		for (const [languageTag, _value] of Object.entries(storage)) {
			for (const path of Object.values(args.options.pathPattern)) {
				// check if directory exists
				const directoryPath = path
					.replace("{languageTag}", languageTag)
					.split("/")
					.slice(0, -1)
					.join("/")
				try {
					await args.fs.readdir(directoryPath)
				} catch {
					await args.fs.mkdir(directoryPath)
				}
			}
			for (const [prefix, value] of Object.entries(_value)) {
				const pathWithLanguage = args.options.pathPattern[prefix]!.replace(
					"{languageTag}",
					languageTag,
				)
				await args.fs.writeFile(
					pathWithLanguage,
					serializeFile(
						value,
						SPACING[pathWithLanguage] ?? defaultSpacing(),
						FILE_HAS_NEW_LINE[pathWithLanguage]!,
						NESTED[pathWithLanguage] ?? defaultNesting(),
						args.options.variableReferencePattern,
					),
				)
			}
		}
	} else {
		// without namespaces
		const storage: Record<LanguageTag, Record<Message["id"], Variant["pattern"]>> | undefined = {}
		for (const message of args.messages) {
			for (const languageTag of Object.keys(message.body)) {
				const serializedPattern: Variant["pattern"] = getVariant(message, {
					languageTag: languageTag,
				}).data!
				storage[languageTag] ??= {}
				storage[languageTag]![message.id] = serializedPattern
			}
		}
		for (const [languageTag, value] of Object.entries(storage)) {
			const pathWithLanguage = args.options.pathPattern.replace("{languageTag}", languageTag)
			await args.fs.writeFile(
				pathWithLanguage,
				serializeFile(
					value,
					SPACING[pathWithLanguage] ?? defaultSpacing(),
					FILE_HAS_NEW_LINE[pathWithLanguage]!,
					NESTED[pathWithLanguage] ?? defaultNesting(),
					args.options.variableReferencePattern,
				),
			)
		}
	}
}

/**
 * Serializes file
 *
 * For all messages that belong in one file.
 *
 * @example const serializedFile = serializeFile(messages, space, endsWithNewLine, nested, variableReferencePattern)
 */
function serializeFile(
	messages: Record<Message["id"], Variant["pattern"]>,
	space: number | string,
	endsWithNewLine: boolean,
	nested: boolean,
	variableReferencePattern: PluginOptions["variableReferencePattern"],
): string {
	let result: Record<string, string> = {}
	for (const [messageId, pattern] of Object.entries(messages)) {
		//check if there are two dots after each other -> that would brake unflatten -> replace with unicode
		let id = replaceAll(messageId, "..", "u002E.")
		//check if the last char is a dot -> that would brake unflatten -> replace with unicode
		if (id.slice(-1) === ".") {
			id = id.replace(/.$/, "u002E")
		}
		result[id] = serializePattern(pattern, variableReferencePattern)
	}
	// for nested structures -> unflatten the keys
	if (nested) {
		result = unflatten(result, {
			//prevent numbers from creating arrays automatically
			object: true,
		})
	}
	return (
		replaceAll(JSON.stringify(result, undefined, space), "u002E", ".") +
		(endsWithNewLine ? "\n" : "")
	)
}

/**
 * Serializes a pattern.
 *
 * @example const serializedPattern = serializePattern(pattern, variableReferencePattern)
 */
function serializePattern(
	pattern: Variant["pattern"],
	variableReferencePattern: PluginOptions["variableReferencePattern"],
) {
	const result: string[] = []
	for (const element of pattern) {
		switch (element.type) {
			case "Text":
				result.push(element.value)
				break
			case "Expression":
				result.push(
					variableReferencePattern![1]
						? `${variableReferencePattern![0]}${element.body.name}${variableReferencePattern![1]}`
						: `${variableReferencePattern![0]}${element.body.name}`,
				)
				break
			default:
				throw new Error(`Unknown message pattern element of type: ${(element as any)?.type}`)
		}
	}
	return result.join("")
}
