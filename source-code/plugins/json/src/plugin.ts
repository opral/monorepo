import type { InlangConfig } from "@inlang/core/config"
import type { InlangEnvironment } from "@inlang/core/environment"
import type * as ast from "@inlang/core/ast"
import { createPlugin } from "@inlang/core/plugin"
import { throwIfInvalidSettings, type PluginSettings } from "./settings.js"
import merge from "lodash.merge"

interface StringWithParents {
	value: string
	parents: string[] | undefined
	id: string
	keyName: string
}

type ExtendedMessagesType = {
	[key: string]: {
		value: string
		parents?: StringWithParents["parents"]
		fileName?: string
		keyName?: string
	}
}

export const plugin = createPlugin<PluginSettings>(({ settings, env }) => ({
	id: "samuelstroschein.inlangPluginJson",
	async config() {
		// will throw if the settings are invalid,
		// leading to better DX because fails fast
		throwIfInvalidSettings(settings)
		return {
			languages: await getLanguages({
				$fs: env.$fs,
				settings,
			}),
			readResources: async (args) =>
				readResources({
					...args,
					$fs: env.$fs,
					settings,
				}),
			writeResources: async (args) =>
				writeResources({
					...args,
					$fs: env.$fs,
					settings,
				}),
		}
	},
}))

/**
 * Automatically derives the languages in this repository.
 */
async function getLanguages(args: { $fs: InlangEnvironment["$fs"]; settings: PluginSettings }) {
	// replace the path
	const [pathBeforeLanguage, pathAfterLanguage] = args.settings.pathPattern.split("{language}")
	const paths = await args.$fs.readdir(pathBeforeLanguage)
	const languages: Array<string> = []
	for (const language of paths) {
		if (!language.includes(".")) {
			// this is a dir
			const languagefiles = await args.$fs.readdir(`${pathBeforeLanguage}${language}`)
			if (languagefiles.length === 0) {
				languages.push(language)
			} else {
				for (const languagefile of languagefiles) {
					// this is the file, check if the language folder contains .json files
					if (
						languagefile.endsWith(".json") &&
						!args.settings.ignore?.some((s) => s === language) &&
						!languages.includes(language)
					) {
						languages.push(language)
					}
				}
			}
		} else if (language.endsWith(".json") && !args.settings.ignore?.some((s) => s === language)) {
			// this is the file, remove the .json extension to only get language name
			languages.push(language.replace(".json", ""))
		}
	}
	return languages
}

/**
 * Reading resources.
 *
 * The function merges the args from Config['readResources'] with the settings
 * and EnvironmentFunctions.
 */
export async function readResources(
	// merging the first argument from config (which contains all arguments)
	// with the custom settings argument
	args: Parameters<InlangConfig["readResources"]>[0] & {
		$fs: InlangEnvironment["$fs"]
		settings: PluginSettings
	},
): ReturnType<InlangConfig["readResources"]> {
	const result: ast.Resource[] = []
	const languages = await getLanguages(args)
	for (const language of languages) {
		const resourcePath = args.settings.pathPattern.replace("{language}", language)
		//try catch workaround because stats is not working
		try {
			// is file
			const stringifiedFile = (await args.$fs.readFile(resourcePath, {
				encoding: "utf-8",
			})) as string
			const space = detectJsonSpacing(
				await args.$fs.readFile(resourcePath, {
					encoding: "utf-8",
				}),
			)
			const extendedMessages = collectStringsWithParents(JSON.parse(stringifiedFile))

			//make a object out of the extendedMessages Array
			let parsedMassagesForAst: ExtendedMessagesType = {}
			extendedMessages.map((message) => {
				parsedMassagesForAst = {
					...parsedMassagesForAst,
					...{
						[message.id]: {
							value: message.value,
							parents: message.parents,
							keyName: message.keyName,
						},
					},
				}
			})
			result.push(
				parseResource(
					parsedMassagesForAst,
					language,
					space,
					args.settings.variableReferencePattern,
				),
			)
		} catch {
			// is directory
			let obj: any = {}
			const path = `${resourcePath.replace("/*.json", "")}`
			const files = await args.$fs.readdir(path)
			const space =
				files.length === 0
					? 2
					: detectJsonSpacing(
							await args.$fs.readFile(`${path}/${files[0]}`, {
								encoding: "utf-8",
							}),
					  )

			if (files.length !== 0) {
				//go through the files per language
				for (const languagefile of files) {
					const stringifiedFile = (await args.$fs.readFile(`${path}/${languagefile}`, {
						encoding: "utf-8",
					})) as string
					const fileName = languagefile.replace(".json", "")
					const extendedMessages = collectStringsWithParents(
						JSON.parse(stringifiedFile),
						[],
						fileName,
					)

					//make a object out of the extendedMessages Array
					let parsedMassagesForAst: ExtendedMessagesType = {}
					extendedMessages.map((message) => {
						parsedMassagesForAst = {
							...parsedMassagesForAst,
							...{
								[message.id]: {
									value: message.value,
									parents: message.parents,
									fileName,
									keyName: message.keyName,
								},
							},
						}
					})

					//merge the objects of every file
					obj = {
						...obj,
						...parsedMassagesForAst,
					}
				}
			}
			result.push(parseResource(obj, language, space, args.settings.variableReferencePattern))
		}
	}
	return result
}

/**
 * Parses a resource.
 *
 * @example
 *  parseResource({ "test": "Hello world" }, "en")
 */
function parseResource(
	messages: ExtendedMessagesType,
	language: string,
	space: number | string,
	variableReferencePattern?: [string, string],
): ast.Resource {
	return {
		type: "Resource",
		metadata: {
			space: space,
		},
		languageTag: {
			type: "LanguageTag",
			name: language,
		},
		body: Object.entries(messages).map(([id, value]) =>
			parseMessage(id, value, variableReferencePattern),
		),
	}
}

/**
 * Parses a message.
 *
 * @example
 *  parseMessage("test", "Hello world")
 */
function parseMessage(
	id: string,
	extendedMessage: ExtendedMessagesType[string],
	variableReferencePattern?: [string, string],
): ast.Message {
	const regex =
		variableReferencePattern &&
		(variableReferencePattern[1]
			? new RegExp(
					`(\\${variableReferencePattern[0]}[^\\${variableReferencePattern[1]}]+\\${variableReferencePattern[1]})`,
					"g",
			  )
			: new RegExp(`(${variableReferencePattern}\\w+)`, "g"))
	const newElements = []
	if (regex) {
		const splitArray = extendedMessage.value.split(regex)
		for (const element of splitArray) {
			if (regex.test(element)) {
				newElements.push({
					type: "Placeholder",
					body: {
						type: "VariableReference",
						name: variableReferencePattern[1]
							? element.slice(
									variableReferencePattern[0].length,
									variableReferencePattern[1].length * -1,
							  )
							: element.slice(variableReferencePattern[0].length),
					},
				})
			} else {
				if (element !== "") {
					newElements.push({
						type: "Text",
						value: element,
					})
				}
			}
		}
	} else {
		newElements.push({
			type: "Text",
			value: extendedMessage.value,
		})
	}

	return {
		type: "Message",
		metadata: {
			...(extendedMessage.fileName !== undefined && {
				fileName: extendedMessage.fileName,
			}),
			...(extendedMessage.parents !== undefined && {
				parentKeys: extendedMessage.parents,
			}),
			...(extendedMessage.keyName !== undefined && {
				keyName: extendedMessage.keyName,
			}),
		},
		id: {
			type: "Identifier",
			name: id,
		},
		pattern: {
			type: "Pattern",
			elements: newElements as Array<ast.Text | ast.Placeholder>,
		},
	}
}

const collectStringsWithParents = (
	obj: any,
	parents: string[] | undefined = [],
	fileName?: string,
) => {
	const results: StringWithParents[] = []

	if (typeof obj === "string") {
		results.push({
			value: obj,
			parents: parents.length > 1 ? parents.slice(0, -1) : undefined,
			id: fileName ? fileName + "." + parents.join(".") : parents.join("."),
			keyName: parents.at(-1),
		})
	} else if (typeof obj === "object" && obj !== null) {
		for (const key in obj) {
			// eslint-disable-next-line no-prototype-builtins
			if (obj.hasOwnProperty(key)) {
				const currentParents = [...parents, key]
				const childResults = collectStringsWithParents(obj[key], currentParents, fileName)
				results.push(...childResults)
			}
		}
	}

	return results
}

const detectJsonSpacing = (jsonString: string) => {
	const patterns = [
		{
			spacing: 1,
			regex: /^{\n {1}[^ ]+.*$/m,
		},
		{
			spacing: 2,
			regex: /^{\n {2}[^ ]+.*$/m,
		},
		{
			spacing: 3,
			regex: /^{\n {3}[^ ]+.*$/m,
		},
		{
			spacing: 4,
			regex: /^{\n {4}[^ ]+.*$/m,
		},
		{
			spacing: 6,
			regex: /^{\n {6}[^ ]+.*$/m,
		},
		{
			spacing: 8,
			regex: /^{\n {8}[^ ]+.*$/m,
		},
	]

	for (const { spacing, regex } of patterns) {
		if (regex.test(jsonString)) {
			return spacing
		}
	}

	return 2 // No matching spacing configuration found
}

/**
 * Writing resources.
 *
 * The function merges the args from Config['readResources'] with the settings
 * and EnvironmentFunctions.
 */
async function writeResources(
	args: Parameters<InlangConfig["writeResources"]>[0] & {
		settings: PluginSettings
		$fs: InlangEnvironment["$fs"]
	},
): ReturnType<InlangConfig["writeResources"]> {
	for (const resource of args.resources) {
		const resourcePath = args.settings.pathPattern.replace("{language}", resource.languageTag.name)
		const space = resource.metadata?.space || 2

		if (resource.body.length === 0) {
			//make a dir if resource with no messages
			if (resourcePath.split(resource.languageTag.name.toString())[1].includes("/")) {
				await args.$fs.mkdir(
					resourcePath.replace(
						resourcePath.split(resource.languageTag.name.toString())[1].toString(),
						"",
					),
				)
				if (!resourcePath.includes("/*.json")) {
					await args.$fs.writeFile(resourcePath, JSON.stringify({}, null, space))
				}
			} else {
				await args.$fs.writeFile(resourcePath, JSON.stringify({}, null, space))
			}
		} else if (resourcePath.includes("/*.json")) {
			//deserialize the file names
			const clonedResource =
				resource.body.length === 0 ? {} : JSON.parse(JSON.stringify(resource.body))
			//get prefixes
			const fileNames: Array<string> = []
			clonedResource.map((message: ast.Message) => {
				if (!message.metadata?.fileName) {
					fileNames.push(message.id.name.split(".")[0])
				} else if (message.metadata?.fileName && !fileNames.includes(message.metadata?.fileName)) {
					fileNames.push(message.metadata?.fileName)
				}
			})
			for (const fileName of fileNames) {
				const filteredMassages = clonedResource
					.filter((message: ast.Message) => message.id.name.startsWith(fileName))
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
					body: filteredMassages,
				}
				await args.$fs.writeFile(
					resourcePath.replace("*", fileName),
					serializeResource(splitedResource, space, args.settings.variableReferencePattern),
				)
			}
		} else {
			await args.$fs.writeFile(
				resourcePath,
				serializeResource(resource, space, args.settings.variableReferencePattern),
			)
		}
	}
}

/**
 * Serializes a resource.
 *
 * The function un-flattens, and therefore reverses the flattening
 * in parseResource, of a given object. The result is a stringified JSON
 * that is beautified by adding (null, 2) to the arguments.
 *
 * @example
 *  serializeResource(resource)
 */
function serializeResource(
	resource: ast.Resource,
	space: number | string,
	variableReferencePattern?: [string, string],
): string {
	const obj = {}
	for (const message of resource.body) {
		const returnedJsonMessage = serializeMessage(message, variableReferencePattern)
		merge(obj, returnedJsonMessage)
	}
	return JSON.stringify(obj, null, space)
}

/**
 * Serializes a message.
 *
 * Note that only the first element of the pattern is used as inlang, as of v0.3,
 * does not support more than 1 element in a pattern.
 */
const serializeMessage = (message: ast.Message, variableReferencePattern?: [string, string]) => {
	const newStringArr = []
	for (const element of message.pattern.elements) {
		if (element.type === "Text" || !variableReferencePattern) {
			newStringArr.push(element.value)
		} else if (element.type === "Placeholder") {
			variableReferencePattern[1]
				? newStringArr.push(
						`${variableReferencePattern[0]}${element.body.name}${variableReferencePattern[1]}`,
				  )
				: newStringArr.push(`${variableReferencePattern[0]}${element.body.name}`)
		}
	}
	const newString: string = newStringArr.join("")
	const newObj: any = {}
	if (message.metadata?.keyName) {
		addNestedKeys(newObj, message.metadata?.parentKeys, message.metadata?.keyName, newString)
	} else if (message.metadata?.fileName) {
		newObj[message.id.name.split(".").slice(1).join(".")] = newString
	} else {
		newObj[message.id.name] = newString
	}

	return newObj
}

const addNestedKeys = (
	obj: any,
	parentKeys: string[] | undefined,
	keyName: string,
	value: string,
) => {
	if (!parentKeys || parentKeys.length === 0) {
		obj[keyName] = value
	} else if (parentKeys.length === 1) {
		obj[parentKeys[0]] = { [keyName]: value }
	} else {
		if (!obj[parentKeys[0]]) {
			obj[parentKeys[0]] = {}
		}
		addNestedKeys(obj[parentKeys[0]], parentKeys.slice(1), keyName, value)
	}
}
