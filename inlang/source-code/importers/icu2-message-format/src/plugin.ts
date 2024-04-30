import * as MF from "messageformat"
import { displayName, description } from "../marketplace-manifest.json"
import { PluginSettings } from "./settings.js"
import { AST } from "@inlang/messages"
import { Importer } from "../../../versioned-interfaces/importer/dist/interface.js"

export const pluginId = "importer.inlang.icu2MessageFormat"

export const plugin: Importer<{
	[pluginId]: PluginSettings
}> = {
	id: pluginId,
	displayName,
	description,
	settingsSchema: PluginSettings,
	importMessages: async ({ settings, nodeishFs }) => {
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
		const messageBundles: AST.MessageBundle[] = messageIDs.map((messageId): AST.MessageBundle => {
			const messages = dictionaries
				.map(([languageTag, messages]) => {
					const messageSource = messages[messageId]
					if (!messageSource) return undefined
					return parseICUMessage(languageTag, messageSource)
				})
				.filter(Boolean) as AST.Message[]

			// TODO Populate Inputs
			const inputOrder: string[] = []

			return {
				id: messageId,
				alias: {},
				inputOrder,
				messages,
			}
		})

		return messageBundles
	},
}

export function parseICUMessage(languageTag: LanguageTag, source: string): Translation {
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

function toVariant(mfVariant: MF.Variant): AST.Variant {
	return {
		match: mfVariant.keys.map((key) => (key.type === "literal" ? key.value : "*")),
		pattern: toPattern(mfVariant.value),
	}
}

function toDeclaration(mfDeclaration: MF.Declaration): AST.Declaration {
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

function toPattern(mfPattern: MF.Pattern): AST.Pattern {
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

function toExpression(mfExpression: MF.Expression): AST.Expression {
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
): AST.FunctionAnnotation {
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
