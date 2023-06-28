import type { InlangConfig } from "@inlang/core/config"
import type { InlangEnvironment } from "@inlang/core/environment"
import type * as ast from "@inlang/core/ast"
import { createPlugin } from "@inlang/core/plugin"
import {
	throwIfInvalidSettings,
	type PluginSettings,
	type PluginSettingsWithDefaults,
} from "./settings.js"
import { ideExtensionConfig } from "./ideExtension/config.js"
import { flatten, unflatten } from "flat"
import { detectJsonSpacing } from "./utilities.js"

/**
 * The spacing of the JSON files in this repository.
 *
 * @example
 *  { "/en.json" = 2 }
 */
const SPACING: Record<string, ReturnType<typeof detectJsonSpacing>> = {}

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

export const plugin = createPlugin<PluginSettings>(({ settings, env }) => ({
	id: "inlang.plugin-i18next",
	async config() {
		// will throw if the settings are invalid,
		// leading to better DX because fails fast
		throwIfInvalidSettings(settings)

		const withDefaultSettings: PluginSettingsWithDefaults = {
			variableReferencePattern: ["{{", "}}"],
			ignore: [], // ignore no files by default
			format: {
				nested: false, // default nesting false
			},
			...settings,
		}

		return {
			languages: await getLanguages({
				$fs: env.$fs,
				settings: withDefaultSettings,
			}),
			readResources: (args) =>
				readResources({
					...args,
					$fs: env.$fs,
					settings: withDefaultSettings,
				}),
			writeResources: (args) =>
				writeResources({
					...args,
					$fs: env.$fs,
					settings: withDefaultSettings,
				}),
			ideExtension: ideExtensionConfig,
		} satisfies Partial<InlangConfig>
	},
}))

/**
 * Automatically derives the languages in this repository.
 */
async function getLanguages(args: { $fs: InlangEnvironment["$fs"]; settings: PluginSettings }) {
	const languages: string[] = []

	if (typeof args.settings.pathPattern !== "string") {
		//resources are stored with namespaces
		for (const path of Object.values(args.settings.pathPattern)) {
			const [pathBeforeLanguage] = path.split("{language}")
			const parentDirectory = await args.$fs.readdir(pathBeforeLanguage!)

			for (const filePath of parentDirectory) {
				//check if file really exists in the dir
				const fileExists = await Promise.resolve(
					args.$fs
						.readFile(path.replace("{language}", filePath))
						.then(() => true)
						.catch(() => false),
				)

				//collect languages for each pathPattern -> so we do not miss any language
				//It is not enough to just get the prentDirectory -> there could be false directories
				if (fileExists) {
					languages.push(filePath)
				}
			}
		}
	} else {
		//resources are stored without namespaces
		const [pathBeforeLanguage] = args.settings.pathPattern.split("{language}")
		const parentDirectory = await args.$fs.readdir(pathBeforeLanguage!)

		for (const filePath of parentDirectory) {
			if (
				filePath.endsWith(".json") &&
				args.settings.ignore?.some((s) => s === filePath) === false
			) {
				languages.push(filePath.replace(".json", ""))
			}
		}
	}

	// Using Set(), an instance of unique values will be created, implicitly using this instance will delete the duplicates.
	return [...new Set(languages)]
}

/**
 * Reading resources.
 */
async function readResources(
	args: Parameters<InlangConfig["readResources"]>[0] & {
		$fs: InlangEnvironment["$fs"]
		settings: PluginSettingsWithDefaults
	},
): ReturnType<InlangConfig["readResources"]> {
	const resources: ast.Resource[] = []
	for (const language of args.config.languages) {
		const resource: ast.Resource = {
			type: "Resource",
			languageTag: {
				type: "LanguageTag",
				name: language,
			},
			body: [],
		}

		if (typeof args.settings.pathPattern !== "string") {
			for (const [prefix, path] of Object.entries(args.settings.pathPattern)) {
				const messages = await getFileToParse(path, language, args.$fs)
				if (messages) {
					resource.body = [
						...resource.body,
						...parseBody(
							messages,
							language,
							args.settings.variableReferencePattern,
							args.settings.format.nested!,
							prefix,
						),
					]
				}
			}
		} else {
			const messages = await getFileToParse(args.settings.pathPattern, language, args.$fs)
			resource.body = [
				...resource.body,
				...parseBody(
					messages,
					language,
					args.settings.variableReferencePattern,
					args.settings.format.nested!,
				),
			]
		}
		resources.push(resource)
	}

	return resources
}

/**
 * Get the files that needs to be parsed.
 */
async function getFileToParse(path: string, language: string, $fs: InlangEnvironment["$fs"]) {
	const pathWithLanguage = path.replace("{language}", language)
	// get file, make sure that is not braking when the namespace doesn't exist in every language dir
	try {
		const file = await $fs.readFile(pathWithLanguage, { encoding: "utf-8" })
		//analyse format of file
		SPACING[pathWithLanguage] = detectJsonSpacing(file as string)
		FILE_HAS_NEW_LINE[pathWithLanguage] = (file as string).endsWith("\n")

		return JSON.parse(file as string)
	} catch (e) {
		// if the namespace doesn't exist for this dir -> continue
		if ((e as any).code === "ENOENT") {
			// file does not exist yet
			return
		}
		throw e
	}
}

/**
 * Parses a resource.
 *
 * @example parseResource(resource, en, 2,["{{", "}}"])
 */
function parseBody(
	messages: Record<string, string>,
	language: string,
	variableReferencePattern: PluginSettingsWithDefaults["variableReferencePattern"],
	isNested: boolean,
	prefix?: string,
): ast.Resource["body"] {
	// Only flatten when there is a nested structure
	const flattenedMessages = isNested
		? flatten(messages, {
				transformKey: function (key) {
					//replace dots in keys with unicode
					return key.replace(".", "u002E")
				},
		  })
		: messages
	if (flattenedMessages !== undefined) {
		//Iterate over the messages and execute parseMessage function
		//If you have a nested structure but didn't add it to config throw error
		return Object.entries(flattenedMessages!).map((message) => {
			if (typeof message[1] !== "string") {
				throw new Error(
					"You configured a flattened key project. If you have nested keys please add 'format: { nested: true }' to the pluginSettings",
				)
			}
			return parseMessage(message[0], message[1], variableReferencePattern, prefix)
		})
	} else {
		return []
	}
}

/**
 * Parses a message.
 *
 * @example parseMessage("testId", "test", ["{{", "}}"])
 */
function parseMessage(
	id: string,
	text: string,
	variableReferencePattern: PluginSettingsWithDefaults["variableReferencePattern"],
	prefix?: string,
): ast.Message {
	// add the prefix infromt if it has namespaces
	const prefixedId = prefix ? prefix + "." + id.replace("u002E", ".") : id.replace("u002E", ".")
	return {
		type: "Message",
		id: {
			type: "Identifier",
			name: prefixedId,
		},
		pattern: parsePattern(text, variableReferencePattern),
	}
}

/**
 * Parses a pattern.
 *
 * @example parseMessage("testId", "test", ["{{", "}}"])
 */
function parsePattern(
	text: string,
	variableReferencePattern: PluginSettingsWithDefaults["variableReferencePattern"],
): ast.Pattern {
	// dependent on the variableReferencePattern, different regex
	// expressions are used for matching
	const placeholder = variableReferencePattern[1]
		? new RegExp(
				`(\\${variableReferencePattern[0]}[^\\${variableReferencePattern[1]}]+\\${variableReferencePattern[1]})`,
				"g",
		  )
		: new RegExp(`(${variableReferencePattern}\\w+)`, "g")
	const elements: ast.Pattern["elements"] = text
		.split(placeholder)
		.filter((element) => element !== "")
		.map((element) => {
			if (placeholder.test(element)) {
				return {
					type: "Placeholder",
					body: {
						type: "VariableReference",
						name: variableReferencePattern[1]
							? element.slice(
									variableReferencePattern[0].length,
									// negative index, removing the trailing pattern
									-variableReferencePattern[1].length,
							  )
							: element.slice(variableReferencePattern[0].length),
					},
				}
			} else {
				return {
					type: "Text",
					value: element,
				}
			}
		})

	return {
		type: "Pattern",
		elements,
	}
}

/**
 * Writing resources.
 *
 * @example writeResources({resources, settings, $fs})
 */
async function writeResources(
	args: Parameters<InlangConfig["writeResources"]>[0] & {
		settings: PluginSettingsWithDefaults
		$fs: InlangEnvironment["$fs"]
	},
): ReturnType<InlangConfig["writeResources"]> {
	for (const resource of args.resources) {
		const language = resource.languageTag.name

		if (typeof args.settings.pathPattern !== "string") {
			for (const [prefix, path] of Object.entries(args.settings.pathPattern)) {
				// check if directory exists
				const directoryPath = path.replace("{language}", language).split("/").slice(0, -1).join("/")
				try {
					await args.$fs.readdir(directoryPath)
				} catch {
					// directory doesn't exists
					await args.$fs.mkdir(directoryPath)
				}
				//filter the messages by prefxes (paths)
				const filteredMessages = resource.body
					.filter((message) => message.id.name.split(".")[0] === prefix)
					//remove the perfix from the id
					.map((message) => ({
						...message,
						id: {
							...message.id,
							name: message.id.name.replace(prefix + ".", ""),
						},
					}))
				//check if there is something to write in this file
				if (filteredMessages.length !== 0) {
					const pathWithLanguage = path.replace("{language}", language)
					await args.$fs.writeFile(
						pathWithLanguage,
						serializeResource(
							filteredMessages,
							SPACING[pathWithLanguage] ?? defaultSpacing(),
							FILE_HAS_NEW_LINE[pathWithLanguage]!,
							args.settings.format.nested!,
							args.settings.variableReferencePattern,
						),
					)
				}
			}
		} else {
			const pathWithLanguage = args.settings.pathPattern.replace("{language}", language)
			await args.$fs.writeFile(
				pathWithLanguage,
				serializeResource(
					resource.body,
					SPACING[pathWithLanguage] ?? defaultSpacing(),
					FILE_HAS_NEW_LINE[pathWithLanguage]!,
					args.settings.format.nested!,
					args.settings.variableReferencePattern,
				),
			)
		}
	}
}

/**
 * Serializes a resource.
 */
function serializeResource(
	messages: ast.Message[],
	space: number | string,
	endsWithNewLine: boolean,
	nested: boolean,
	variableReferencePattern: PluginSettingsWithDefaults["variableReferencePattern"],
): string {
	let result: { [key: string]: string } = {}
	for (const message of messages) {
		//check if there are two dots after each other -> that would brake unflatten -> replace with unicode
		let id = message.id.name.replace("..", "u002E.")
		//check if the last char is a dot -> that would brake unflatten -> replace with unicode
		if (id.slice(-1) === ".") {
			id = id.replace(/.$/, "u002E")
		}
		result[id] = serializePattern(message.pattern, variableReferencePattern)
	}
	// for nested structures -> unflatten the keys
	if (nested) {
		result = unflatten(result, {
			//prevent numbers from creating arrays automatically
			object: true,
		})
	}
	return (
		JSON.stringify(result, undefined, space).replace("u002E", ".") + (endsWithNewLine ? "\n" : "")
	)
}

/**
 * Serializes a pattern.
 */
function serializePattern(
	pattern: ast.Message["pattern"],
	variableReferencePattern: PluginSettingsWithDefaults["variableReferencePattern"],
) {
	const result: string[] = []
	for (const element of pattern.elements) {
		switch (element.type) {
			case "Text":
				result.push(element.value)
				break
			case "Placeholder":
				result.push(
					variableReferencePattern[1]
						? `${variableReferencePattern[0]}${element.body.name}${variableReferencePattern[1]}`
						: `${variableReferencePattern[0]}${element.body.name}`,
				)
				break
			default:
				throw new Error(`Unknown message pattern element of type: ${(element as any)?.type}`)
		}
	}
	return result.join("")
}
