/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Message, Variant, LanguageTag, Plugin, NodeishFilesystemSubset } from "@inlang/plugin"
import { throwIfInvalidSettings, type PluginSettings } from "./settings.js"
import { detectJsonSpacing, detectIsNested, replaceAll } from "./utilities.js"
import { ideExtensionConfig } from "./ideExtension/config.js"
import { flatten, unflatten } from "flat"
import { id, displayName, description } from "../marketplace-manifest.json"

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

export const plugin: Plugin<PluginSettings> = {
	id: id as Plugin["id"],
	displayName,
	description,
	loadMessages: async ({ languageTags, sourceLanguageTag, settings, nodeishFs }) => {
		settings.variableReferencePattern = settings.variableReferencePattern || ["{{", "}}"]
		throwIfInvalidSettings(settings)
		SPACING = {}
		NESTED = {}
		FILE_HAS_NEW_LINE = {}
		return loadMessages({
			nodeishFs,
			settings,
			languageTags,
			sourceLanguageTag,
		})
	},
	saveMessages: async ({ messages, settings, nodeishFs }) => {
		settings.variableReferencePattern = settings.variableReferencePattern || ["{{", "}}"]
		throwIfInvalidSettings(settings)
		return saveMessages({
			nodeishFs,
			settings,
			messages,
		})
	},
	detectedLanguageTags: async ({ nodeishFs, settings }) => {
		settings.ignore = settings.ignore || []
		return detectLanguageTags({
			nodeishFs,
			settings,
		})
	},
	addCustomApi: ({ settings }) => ideExtensionConfig(settings),
}

/**
 * Load messages
 *
 * @example const messages = await loadMessages({ fs, settings, languageTags })
 */
async function loadMessages(args: {
	nodeishFs: NodeishFilesystemSubset
	settings: PluginSettings
	languageTags: Readonly<LanguageTag[]>
	sourceLanguageTag: LanguageTag
}): Promise<Message[]> {
	const messages: Message[] = []
	for (const languageTag of resolveOrderOfLanguageTags(args.languageTags, args.sourceLanguageTag)) {
		if (typeof args.settings.pathPattern !== "string") {
			for (const [prefix, path] of Object.entries(args.settings.pathPattern)) {
				const messagesFromFile = await getFileToParse(path, languageTag, args.nodeishFs)
				for (const [key, value] of Object.entries(messagesFromFile)) {
					const prefixedKey = prefix + ":" + replaceAll(key, "u002E", ".")
					addVariantToMessages(messages, prefixedKey, languageTag, value, args.settings)
				}
			}
		} else {
			const messagesFromFile = await getFileToParse(
				args.settings.pathPattern,
				languageTag,
				args.nodeishFs,
			)
			for (const [key, value] of Object.entries(messagesFromFile)) {
				addVariantToMessages(
					messages,
					replaceAll(key, "u002E", "."),
					languageTag,
					value,
					args.settings,
				)
			}
		}
	}
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
	nodeishFs: NodeishFilesystemSubset,
): Promise<Record<string, string>> {
	const pathWithLanguage = path.replace("{languageTag}", languageTag)
	// get file, make sure that is not braking when the namespace doesn't exist in every languageTag dir
	try {
		const file = await nodeishFs.readFile(pathWithLanguage, { encoding: "utf-8" })
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
 * Resolve order of languageTags, move sourceLanguage to the first spot
 */
const resolveOrderOfLanguageTags = (
	languageTags: Readonly<LanguageTag[]>,
	sourceLanguageTag: LanguageTag,
): LanguageTag[] => {
	const filteredTags = languageTags.filter((t) => t !== sourceLanguageTag) // Remove sourceLanguageTag
	filteredTags.unshift(sourceLanguageTag) // Add sourceLanguageTag to the beginning of the filtered array
	return filteredTags
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
	settings: PluginSettings,
) => {
	const messageIndex = messages.findIndex((m) => m.id === key)
	if (messageIndex !== -1) {
		const variant: Variant = {
			languageTag,
			match: {},
			pattern: parsePattern(value, settings.variableReferencePattern!),
		}

		//push new variant
		messages[messageIndex]?.variants.push(variant)
	} else {
		// message does not exist
		const message: Message = {
			id: key,
			selectors: [],
			variants: [],
		}
		message.variants = [
			{
				languageTag,
				match: {},
				pattern: parsePattern(value, settings.variableReferencePattern!),
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
function parsePattern(text: string, variableReferencePattern: string[]): Variant["pattern"] {
	// dependent on the variableReferencePattern, different regex
	// expressions are used for matching

	const expression = variableReferencePattern[1]
		? new RegExp(
				`(\\${variableReferencePattern[0]}[^\\${variableReferencePattern[1]}]+\\${variableReferencePattern[1]})`,
				"g",
		  )
		: new RegExp(`(${variableReferencePattern}\\w+)`, "g")

	const pattern: Variant["pattern"] = text
		.split(expression)
		.filter((element) => element !== "")
		.map((element) => {
			if (expression.test(element) && variableReferencePattern[0]) {
				return {
					type: "VariableReference",
					name: variableReferencePattern[1]
						? element.slice(
								variableReferencePattern[0].length,
								// negative index, removing the trailing pattern
								-variableReferencePattern[1].length,
						  )
						: element.slice(variableReferencePattern[0].length),
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
 * @example await saveMessages({ fs, settings, messages })
 */
async function saveMessages(args: {
	nodeishFs: NodeishFilesystemSubset
	settings: PluginSettings
	messages: Message[]
}) {
	if (typeof args.settings.pathPattern === "object") {
		// with namespaces
		const storage: Record<
			LanguageTag,
			Record<string, Record<Message["id"], Variant["pattern"]>>
		> = {}
		for (const message of args.messages) {
			for (const variant of message.variants) {
				const prefix: string = message.id.includes(":")
					? (message.id.split(":")[0] as string)
					: // TODO remove default namespace functionallity, add better parser
					  (Object.keys(args.settings.pathPattern)[0] as string)
				const resolvedId = message.id.replace(prefix + ":", "")

				storage[variant.languageTag] ??= {}
				storage[variant.languageTag]![prefix] ??= {}
				storage[variant.languageTag]![prefix]![resolvedId] = variant.pattern
			}
		}
		for (const [languageTag, _value] of Object.entries(storage)) {
			for (const path of Object.values(args.settings.pathPattern)) {
				// check if directory exists
				const directoryPath = path
					.replace("{languageTag}", languageTag)
					.split("/")
					.slice(0, -1)
					.join("/")
				try {
					await args.nodeishFs.readdir(directoryPath)
				} catch {
					await args.nodeishFs.mkdir(directoryPath)
				}
			}
			for (const [prefix, value] of Object.entries(_value)) {
				const pathWithLanguage = (args.settings.pathPattern[prefix] as string).replace(
					"{languageTag}",
					languageTag,
				)
				await args.nodeishFs.writeFile(
					pathWithLanguage,
					serializeFile(
						value,
						SPACING[pathWithLanguage] ?? defaultSpacing(),
						FILE_HAS_NEW_LINE[pathWithLanguage]!,
						NESTED[pathWithLanguage] ?? defaultNesting(),
						args.settings.variableReferencePattern,
					),
				)
			}
		}
	} else {
		// without namespaces
		const storage: Record<LanguageTag, Record<Message["id"], Variant["pattern"]>> | undefined = {}
		for (const message of args.messages) {
			for (const variant of message.variants) {
				storage[variant.languageTag] ??= {}
				storage[variant.languageTag]![message.id] = variant.pattern
			}
		}
		for (const [languageTag, value] of Object.entries(storage)) {
			const pathWithLanguage = args.settings.pathPattern.replace("{languageTag}", languageTag)
			try {
				await args.nodeishFs.readdir(pathWithLanguage.split("/").slice(0, -1).join("/"))
			} catch {
				await args.nodeishFs.mkdir(pathWithLanguage.split("/").slice(0, -1).join("/"), {
					recursive: true,
				})
			}
			await args.nodeishFs.writeFile(
				pathWithLanguage,
				serializeFile(
					value,
					SPACING[pathWithLanguage] ?? defaultSpacing(),
					FILE_HAS_NEW_LINE[pathWithLanguage]!,
					NESTED[pathWithLanguage] ?? defaultNesting(),
					args.settings.variableReferencePattern,
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
	variableReferencePattern: PluginSettings["variableReferencePattern"],
): string {
	let result: Record<string, string> = {}
	for (const [messageId, pattern] of Object.entries(messages)) {
		//check if there are two dots after each other -> that would brake unflatten -> replace with unicode
		let id = replaceAll(messageId, "..", "u002E.")
		//check if the last char is a dot -> that would brake unflatten -> replace with unicode
		if (id.slice(-1) === ".") {
			id = id.replace(/.$/, "u002E")
		}
		result[id] = serializePattern(pattern, variableReferencePattern!)
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
function serializePattern(pattern: Variant["pattern"], variableReferencePattern: string[]) {
	const result: string[] = []
	for (const element of pattern) {
		switch (element.type) {
			case "Text":
				result.push(element.value)
				break
			case "VariableReference":
				result.push(
					variableReferencePattern[1]
						? `${variableReferencePattern[0]}${element.name}${variableReferencePattern[1]}`
						: `${variableReferencePattern[0]}${element.name}`,
				)
				break
			default:
				throw new Error(`Unknown message pattern element of type: ${(element as any)?.type}`)
		}
	}
	return result.join("")
}

/**
 * Detect languageTags from resources
 *
 * @example const languageTags = await detectLanguageTags({ fs, settings })
 */
async function detectLanguageTags(args: {
	nodeishFs: NodeishFilesystemSubset
	settings: PluginSettings
}): Promise<string[]> {
	const languages: string[] = []

	// because of duplication of code the pathArray is eather parsed by th epathPattern object or created by the pathPattern string
	const pathArray: Array<string> =
		typeof args.settings.pathPattern !== "string"
			? Object.values(args.settings.pathPattern)
			: [args.settings.pathPattern]

	// When there are namespaces, this will loop through all namespaces and collect the languages, otherwise it is just one path
	for (const path of pathArray) {
		const [pathBeforeLanguage] = path.split("{languageTag}")
		const parentDirectory = await args.nodeishFs.readdir(pathBeforeLanguage!)

		for (const filePath of parentDirectory) {
			//check if file really exists in the dir
			const fileExists = await Promise.resolve(
				args.nodeishFs
					.readFile(path.replace("{languageTag}", filePath.replace(".json", "")))
					.then(() => true)
					.catch(() => false),
			)
			//collect languages for each pathPattern -> so we do not miss any language
			//It is not enough to just get the prentDirectory -> there could be false directories
			if (fileExists && args.settings.ignore?.some((s) => s === filePath) === false) {
				languages.push(filePath.replace(".json", ""))
			}
		}
	}

	// Using Set(), an instance of unique values will be created, implicitly using this instance will delete the duplicates.
	return [...new Set(languages)]
}
