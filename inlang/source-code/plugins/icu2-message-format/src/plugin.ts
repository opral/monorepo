import type {
	Declaration,
	Expression,
	FunctionAnnotation,
	LanguageTag,
	Message,
	Pattern,
	Plugin,
	Translation,
	Variant,
} from "@inlang/sdk"
import * as MF from "messageformat"
import { displayName, description } from "../marketplace-manifest.json"
import { PluginSettings } from "./settings.js"

export const pluginId = "plugin.inlang.icu2MessageFormat"

export const plugin: Plugin<{
	[pluginId]: PluginSettings
}> = {
	id: pluginId,
	displayName,
	description,
	settingsSchema: PluginSettings,
	loadMessages: async ({ settings, nodeishFs }) => {
		const pathPattern = settings["plugin.inlang.icu2MessageFormat"].pathPattern

		const dictionaries = await Promise.all(
			settings.languageTags.map(async (languageTag) => {
				try {
					const filePath = pathPattern.replace("{languageTag}", languageTag)
					const file = await nodeishFs.readFile(filePath, { encoding: "utf-8" })
					return [languageTag, JSON.parse(file) as Record<string, string>] as const
				} catch {
					// file does not exist. likely, no translations for the file exist yet.
					return [languageTag, {}] as const
				}
			})
		)

		// collect all messageIDs across all dictionaries
		const messageIDs = [...new Set(dictionaries.flatMap(([, messages]) => Object.keys(messages)))]

		// create message objects for each ID
		const messages: Message[] = messageIDs.map((messageId) => {
			const translations: Translation[] = []
			const inputs: string[] = []
			for (const [languageTag, messages] of dictionaries) {
				const message = messages[messageId]
				if (!message) continue
				translations.push(parseICUMessage(languageTag, message))
			}

			return {
				id: messageId,
				alias: {},
				inputs,
				translations,
			}
		})
		return messages
	},
	saveMessages: async () => {
		console.warn("The ICU2 MessageFormat Plugin does not implement saving.")
		return
	},
}

function parseICUMessage(languageTag: LanguageTag, source: string): Translation {
	const ast = MF.parseMessage(source)
	const declarations = ast.declarations.map(toDeclaration)

	switch (ast.type) {
		case "message": {
			return {
				languageTag,
				declarations,
				selectors: [],
				variants: [
					{
						match: [],
						pattern: toPattern(ast.pattern),
					},
				],
			}
		}
		case "select": {
			return {
				languageTag,
				declarations,
				selectors: ast.selectors.map(toExpression),
				variants: ast.variants.map(toVariant),
			}
		}
	}
}

function toVariant(mfVariant: MF.Variant): Variant {
	return {
		match: mfVariant.keys.map((key) => (key.type === "literal" ? key.value : "*")),
		pattern: toPattern(mfVariant.value),
	}
}

function toDeclaration(mfDeclaration: MF.Declaration): Declaration {
	switch (mfDeclaration.type) {
		case "input":
		case "local": {
			return {
				type: mfDeclaration.type,
				name: mfDeclaration.name,
				value: toExpression(mfDeclaration.value),
			}
		}
		default: {
			throw new Error("Unknown declaration type: " + mfDeclaration.type)
		}
	}
}

function toPattern(mfPattern: MF.Pattern): Pattern {
	return mfPattern.map((element) => {
		if (typeof element == "string")
			return {
				type: "text",
				value: element,
			}

		if (element.type === "expression") return toExpression(element)
		throw new Error("Unknown pattern element type: " + element.type)
	})
}

function toExpression(mfExpression: MF.Expression): Expression {
	const annotation = mfExpression.annotation
	const arg = mfExpression.arg
	if (!arg) throw new Error()
	return {
		type: "expression",
		arg,
		annotation: annotation ? toAnnotation(annotation) : undefined,
	}
}

function toAnnotation(
	mfAnnotation: MF.FunctionAnnotation | MF.UnsupportedAnnotation
): FunctionAnnotation {
	if (mfAnnotation.type !== "function") throw new Error("Junk annotation")
	return {
		type: "function",
		name: mfAnnotation.name,
		options:
			mfAnnotation.options?.map((mfOption) => ({
				name: mfOption.name,
				value: mfOption.value,
			})) || [],
	}
}
