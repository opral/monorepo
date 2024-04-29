import * as AST from "./ast.js"
import * as LegecyFormat from "@inlang/message"

/**
 * @throws If the message cannot be represented in the legacy format
 */
export function toLegacyMessage(bundle: AST.MessageBundle): LegecyFormat.Message {
	const variants: LegecyFormat.Variant[] = []
	const selectorNames = new Set<string>()

	for (const message of bundle.messages) {
		// collect all selector names
		for (const selector of message.selectors.map(toLegacyExpression)) {
			selectorNames.add(selector.name)
		}

		// collect all variants
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
				throw new Error(`Unsupported pattern element type`)
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
	const inputOrder: string[] = []

	const messages: AST.Message[] = languages.map((language): AST.Message => {
		//All variants that will be part of this message
		const legacyVariants = legacyMessage.variants.filter(
			(variant) => variant.languageTag === language
		)

		//find all selector names
		const selectorNames = new Set<string>()
		for (const legacySelector of legacyMessage.selectors) {
			selectorNames.add(legacySelector.name)
		}
		const selectors: AST.Expression[] = [...selectorNames].map((name) => ({
			type: "expression",
			annotation: undefined,
			arg: {
				type: "variable",
				name: name,
			},
		}))

		//The set of variables that need to be defined - Certainly includes the selectors
		const variableNames = new Set<string>(selectorNames)
		const variants: AST.Variant[] = []
		for (const legacyVariant of legacyVariants) {
			for (const element of legacyVariant.pattern) {
				if (element.type === "VariableReference") {
					variableNames.add(element.name)
				}
			}

			variants.push({
				match: legacyVariant.match,
				pattern: fromLegacyPattern(legacyVariant.pattern),
			})
		}

		//Add the inputs to the list of inputs
		for (const variableName of variableNames) {
			if (!inputOrder.includes(variableName)) {
				inputOrder.push(variableName)
			}
		}

		//Create an input declaration for each variable and selector we need
		const declarations: AST.Declaration[] = [...variableNames].map((name) => ({
			type: "input",
			name,
			value: {
				type: "expression",
				annotation: undefined,
				arg: {
					type: "variable",
					name,
				},
			},
		}))

		return {
			locale: language,
			declarations,
			selectors,
			variants,
		}
	})

	return {
		id: legacyMessage.id,
		alias: legacyMessage.alias,
		inputOrder,
		messages,
	}
}

function fromLegacyPattern(pattern: LegecyFormat.Pattern): AST.Pattern {
	return pattern.map((element) => {
		switch (element.type) {
			case "Text": {
				return {
					type: "text",
					value: element.value,
				}
			}
			case "VariableReference":
				return {
					type: "expression",
					arg: {
						type: "variable",
						name: element.name,
					},
				}
		}
	})
}

/**
 * Dedupes an array by converting it to a set and back
 */
const dedupe = <T extends Array<unknown>>(arr: T): T => [...new Set(arr)] as T
