import type { InlangConfig } from "@inlang/core/config"
import type { InlangEnvironment } from "@inlang/core/environment"
import type * as ast from "@inlang/core/ast"
import { createPlugin } from "@inlang/core/plugin"
import {
	throwIfInvalidSettings,
	type PluginSettings,
	type PluginSettingsWithDefaults,
} from "./settings.js"
import merge from "lodash.merge"
import {
	addNestedKeys,
	pathIsDirectory,
	collectNestedSerializedMessages,
	detectJsonSpacing,
} from "./utilities.js"
import { ideExtensionConfig } from "./ideExtension/config.js"
import type { MessageMetadata, SerializedMessage } from "./types.js"

/**
 * Whether the repository uses the wildcard structure.
 *
 * @example
 *   pathPattern: "/{language}/*.json" -> true
 *   pathPattern: "/{language}/resource.json" -> false
 */
let REPO_USES_WILDCARD_STRUCTURE: boolean

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
			...settings,
		}

		REPO_USES_WILDCARD_STRUCTURE = settings.pathPattern.endsWith("/*.json")

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
	// replace the path
	const [pathBeforeLanguage] = args.settings.pathPattern.split("{language}")
	if (pathBeforeLanguage === undefined) {
		throw new Error("pathPattern must contain {language} placeholder")
	}
	const parentDirectory = await args.$fs.readdir(pathBeforeLanguage)
	const languages: string[] = []

	for (const filePath of parentDirectory) {
		const isDirectory = await pathIsDirectory({
			path: pathBeforeLanguage + filePath,
			$fs: args.$fs,
		})

		if (isDirectory) {
			languages.push(filePath)
		} else if (
			filePath.endsWith(".json") &&
			args.settings.ignore?.some((s) => s === filePath) === false
		) {
			languages.push(filePath.replace(".json", ""))
		}
	}
	return languages
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
	const result: ast.Resource[] = []

	for (const language of args.config.languages) {
		let serializedMessages: SerializedMessage[] = []
		const resourcePath = args.settings.pathPattern.replace("{language}", language)
		try {
			if (REPO_USES_WILDCARD_STRUCTURE) {
				const directoryPath = `${resourcePath.replace("/*.json", "")}`
				const files = await args.$fs.readdir(directoryPath)
				for (const potentialResourcePath of files) {
					if (args.settings.ignore?.some((s) => s === potentialResourcePath) === true) {
						continue
					}
					const file = (await args.$fs.readFile(`${directoryPath}/${potentialResourcePath}`, {
						encoding: "utf-8",
					})) as string

					FILE_HAS_NEW_LINE[`${directoryPath}/${potentialResourcePath}`] = file.endsWith("\n")
					SPACING[`${directoryPath}/${potentialResourcePath}`] = detectJsonSpacing(file)

					serializedMessages = [
						...serializedMessages,
						...collectNestedSerializedMessages(
							JSON.parse(file),
							[],
							potentialResourcePath.replace(".json", ""),
						),
					]
				}
			} else {
				const file = (await args.$fs.readFile(resourcePath, {
					encoding: "utf-8",
				})) as string

				FILE_HAS_NEW_LINE[`${resourcePath}`] = file.endsWith("\n")
				SPACING[`${resourcePath}`] = detectJsonSpacing(file)

				serializedMessages = collectNestedSerializedMessages(JSON.parse(file))
			}
			result.push(
				parseResource(serializedMessages, language, args.settings.variableReferencePattern),
			)
		} catch (e) {
			if ((e as any).code === "ENOENT") {
				// file does not exist yet
				continue
			}
			throw e
		}
	}
	return result
}

/**
 * Parses a resource.
 *
 * @example parseResource(resource, en, 2,["{{", "}}"])
 */
function parseResource(
	serializedMessages: SerializedMessage[],
	language: string,
	variableReferencePattern: PluginSettingsWithDefaults["variableReferencePattern"],
): ast.Resource {
	return {
		type: "Resource",
		languageTag: {
			type: "LanguageTag",
			name: language,
		},
		body: serializedMessages.map((serializedMessage) => {
			return parseMessage(serializedMessage, variableReferencePattern)
		}),
	}
}

/**
 * Parses a message.
 *
 * @example parseMessage("testId", "test", ["{{", "}}"])
 */
function parseMessage(
	serializedMessage: SerializedMessage,
	variableReferencePattern: PluginSettingsWithDefaults["variableReferencePattern"],
): ast.Message {
	return {
		type: "Message",
		metadata: {
			fileName: serializedMessage.fileName,
			keyName: serializedMessage.keyName,
			parentKeys: serializedMessage.parentKeys,
		} satisfies MessageMetadata,
		id: {
			type: "Identifier",
			name: serializedMessage.id,
		},
		pattern: parsePattern(serializedMessage.text, variableReferencePattern),
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
		const resourcePath = args.settings.pathPattern.replace("{language}", resource.languageTag.name)

		if (REPO_USES_WILDCARD_STRUCTURE === false) {
			await args.$fs.writeFile(
				resourcePath,
				serializeResource(
					resource,
					SPACING[resourcePath] ?? defaultSpacing(),
					FILE_HAS_NEW_LINE[resourcePath]!,
					args.settings.variableReferencePattern,
				),
			)
		} else if (REPO_USES_WILDCARD_STRUCTURE) {
			// just in case try to create a directory to not make file operations fail
			const [directoryPath] = resourcePath.split("/*.json")
			try {
				await args.$fs.readdir(directoryPath!)
			} catch {
				// directory doesn't exists
				await args.$fs.mkdir(directoryPath!)
			}

			//* Performance optimization in the future: Only iterate over the resource body once
			const filePaths = new Set(resource.body.map((message) => message.id.name!.split(".")[0]))

			for (const fileName of filePaths) {
				const filteredMessages = resource.body
					.filter((message: ast.Message) => message.id.name.startsWith(fileName!))
					.map((message: ast.Message) => {
						return {
							...message,
							id: {
								...message.id,
								name: message.id.name.replace(`${fileName}.`, ""),
							},
						}
					})
				const splitedResource: ast.Resource = {
					type: resource.type,
					languageTag: resource.languageTag,
					body: filteredMessages,
				}
				const path = resourcePath.replace("*", fileName!)

				await args.$fs.writeFile(
					path,
					serializeResource(
						splitedResource,
						SPACING[path] ?? defaultSpacing(),
						FILE_HAS_NEW_LINE[path]!,
						args.settings.variableReferencePattern,
					),
				)
			}
		} else {
			throw new Error("None-exhaustive if statement in writeResources")
		}
	}
}

/**
 * Serializes a resource.
 */
function serializeResource(
	resource: ast.Resource,
	space: number | string,
	withNewLine: boolean,
	variableReferencePattern: PluginSettingsWithDefaults["variableReferencePattern"],
): string {
	const result = {}
	for (const message of resource.body) {
		const msg: Record<string, string | Record<string, string>> = {}
		const serializedPattern = serializePattern(message.pattern, variableReferencePattern)
		if (message.metadata?.keyName) {
			addNestedKeys(msg, message.metadata.parentKeys, message.metadata.keyName, serializedPattern)
		} else if (message.metadata?.fileName) {
			msg[message.id.name.split(".").slice(1).join(".")] = serializedPattern
		} else {
			msg[message.id.name] = serializedPattern
		}
		// nested keys
		merge(result, msg)
	}
	return JSON.stringify(result, undefined, space) + (withNewLine ? "\n" : "")
}

/**
 * Serializes a pattern.
 */
function serializePattern(
	pattern: ast.Message["pattern"],
	variableReferencePattern: PluginSettingsWithDefaults["variableReferencePattern"],
) {
	const result = []
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

/**
 * Parses a message.
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
