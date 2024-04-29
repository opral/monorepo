import * as AST from "./ast.js"
import * as LegecyFormat from "@inlang/message"

/**
 * @throws If the message cannot be represented in the legacy format
 */
export function toLegacyMessage(bundle: AST.MessageBundle): LegecyFormat.Message {
	const variants: LegecyFormat.Variant[] = []
	const selectorNames = new Set<string>()

	for (const message of bundle.messages) {
		const legacySelectors = message.selectors.map(toLegacyExpression)
		for (const legecySelector of legacySelectors) {
			selectorNames.add(legecySelector.name)
		}

		for (const variant of message.variants) {
			variants.push({
				languageTag: message.locale,
				match: variant.match,
				pattern: toLegacyPattern(variant.pattern),
			})
		}
	}

	const selectors: LegecyFormat.Expression[] = [...selectorNames].map((name) => ({
		type: "VariableReference",
		name,
	}))

	return {
		id: bundle.id,
		alias: bundle.alias,
		variants,
		selectors,
	}
}

/**
 * @throws If the pattern cannot be represented in the legacy format
 */
function toLegacyPattern(pattern: AST.Pattern): LegecyFormat.Pattern {
	return pattern.map((element) => {
		switch (element.type) {
			case "text": {
				return {
					type: "Text",
					value: element.value,
				}
			}

			case "expression": {
				return toLegacyExpression(element)
			}

			default: {
				throw new Error(`Unsupported pattern element type: ${element.type}`)
			}
		}
	})
}

function toLegacyExpression(expression: AST.Expression): LegecyFormat.Expression {
	if (expression.annotation !== undefined)
		throw new Error("Cannot convert an expression with an annotation to the legacy format")

	if (expression.arg.type !== "variable") {
		throw new Error("Can only convert variable references to the legacy format")
	}

	return {
		type: "VariableReference",
		name: expression.arg.name,
	}
}

export function fromLegacyMessaeg(legacyMessage: LegecyFormat.Message): AST.MessageBundle {
	const languages = dedupe(legacyMessage.variants.map((variant) => variant.languageTag))

	const messages: AST.Message[] = languages.map((language) => {
		const variants = legacyMessage.variants.filter((variant) => variant.languageTag === language)

		return {
			locale: language,
			variants,
		}
	})

	const inputs: string[] = []

	return {
		id: legacyMessage.id,
		alias: legacyMessage.alias,
		inputOrder: inputs,
		messages,
	}
}

const dedupe = <T extends Array<unknown>>(arr: T): T => [...new Set(arr)] as T
