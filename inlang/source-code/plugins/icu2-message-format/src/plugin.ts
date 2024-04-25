import type {
	Declaration,
	Expression,
	FunctionAnnotation,
	LanguageTag,
	Message,
	Pattern,
	Plugin,
	Translation,
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
			const translations: Record<LanguageTag, Translation> = {}
			const inputs: string[] = []
			for (const [languageTag, messages] of dictionaries) {
				const message = messages[messageId]
				if (!message) continue
				translations[languageTag] = parseICUMessage(message)
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

function parseICUMessage(source: string): Translation {
	const ast = MF.parseCST(source)
	if (ast.errors) throw new Error(JSON.stringify(ast.errors))
	const declarations = ast.declarations?.map(toDeclaration) || []

	switch (ast.type) {
		case "simple": {
			return {
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
		case "complex": {
			break
		}
		case "select": {
			break
		}
	}
}

function toDeclaration(mfDeclaration: MF.CST.Declaration): Declaration {
	switch (mfDeclaration.type) {
		case "input":
		case "local": {
			if (mfDeclaration.value.type == "junk") throw new Error("Junk value in declaration")
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

function toPattern(mfPattern: MF.CST.Pattern): Pattern {
	return mfPattern.body.map((element) => {
		if (element.type === "expression") return toExpression(element)
		else return element
	})
}

function toExpression(mfExpression: MF.CST.Expression): Expression {
	const annotation = mfExpression.annotation
	const arg = mfExpression.arg
	return {
		type: "expression",
		arg,
		annotation: annotation ? toAnnotation(annotation) : undefined,
	}
}

function toAnnotation(
	mfAnnotation: MF.CST.Junk | MF.CST.FunctionRef | MF.CST.ReservedAnnotation
): FunctionAnnotation {
	if (mfAnnotation.type !== "function") throw new Error("Junk annotation")
	return mfAnnotation
}
