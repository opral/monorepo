import type {
	Message,
	Variant,
	LanguageTag,
	InlangEnvironment,
	InlangConfig,
	Plugin,
} from "@inlang/plugin"
import { throwIfInvalidOptions } from "./options.js"
import { detectJsonSpacing, detectIsNested, replaceAll } from "./utilities.js"
import { flatten } from "flat"

export type PluginOptions = {
	pathPattern: string | Record<string, string>
	variableReferencePattern?: [string, string]
	ignore?: string[]
}

// ----------------------------------------------------------------------------

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

// const pluginOptions: PluginSettingsWithDefaults = {
// 	variableReferencePattern: ["{{", "}}"],
// 	ignore: [], // ignore no files by default
// 	...options,
// }

let pluginOptions: PluginOptions | undefined = undefined
let pluginConfig: InlangConfig | undefined = undefined
let pluginFs: InlangEnvironment["$fs"] | undefined = undefined

export const plugin: Plugin<PluginOptions> = {
	meta: {
		id: "inlang.plugin-i18next",
		displayName: { en: "i18next" },
		description: { en: "i18next plugin for inlang" },
		keywords: ["i18next", "react", "nextjs"],
	},
	setup: ({ options, config, $fs }) => {
		options.variableReferencePattern = ["{{", "}}"]
		options.ignore = []
		throwIfInvalidOptions(options)
		pluginOptions = options
		pluginConfig = config
		pluginFs = $fs
		return {}
	},
	loadMessages: async () => {
		if (!pluginFs || !pluginConfig || !pluginOptions) throw new Error("Plugin not setup")
		return loadMessages({
			$fs: pluginFs,
			config: pluginConfig,
			options: pluginOptions,
		})
	},
	saveMessages: async () => {
		// return saveMessages({
		// 	$fs: pluginFs!,
		// 	config: pluginConfig!,
		// 	options: pluginOptions!,
		// })
	},
	// addAppSpecificApi: () => {
	// 	return {
	// 		"inlang.ide-extension": {
	// 			messageReferenceMatcher: () => {},
	// 		},
	// 		"inlang.cli": {
	// 			cliExtract: () => {},
	// 		},
	// 	}
	// },
}

/**
 * Reading resources.
 */
async function loadMessages(args: {
	$fs: InlangEnvironment["$fs"]
	config: InlangConfig
	options: PluginOptions
}): Promise<Message[]> {
	const messages: Message[] = []
	for (const languageTag of args.config.languageTags) {
		if (typeof args.options.pathPattern !== "string") {
			for (const [prefix, path] of Object.entries(args.options.pathPattern)) {
				const messagesFromFile = await getFileToParse(
					path,
					NESTED[path.replace("{language}", languageTag)] ?? defaultNesting(),
					languageTag,
					args.$fs,
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
				args.$fs,
			)
			for (const [key, value] of Object.entries(messagesFromFile)) {
				addVariantToMessages(messages, key, languageTag, value)
			}
		}
	}
	//console.log(messages)
	return messages
}

/**
 * Get the files that needs to be parsed.
 */
async function getFileToParse(
	path: string,
	isNested: boolean,
	language: string,
	$fs: InlangEnvironment["$fs"],
): Promise<Record<string, string>> {
	const pathWithLanguage = path.replace("{language}", language)
	// get file, make sure that is not braking when the namespace doesn't exist in every language dir
	try {
		const file = await $fs.readFile(pathWithLanguage, { encoding: "utf-8" })
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
			pattern: [
				{
					type: "Text",
					value,
				},
			],
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
				pattern: [
					{
						type: "Text",
						value,
					},
				],
			},
		]
		messages.push(message)
	}
}
