/**
 * Convert between v1 Message and v2 MessageBundle formats.
 * Code adapted from https://github.com/opral/monorepo/pull/2655 legacy.ts
 */

import * as V2 from "./types.js"
import * as V1 from "@inlang/message"

/**
 * @throws If the message cannot be represented in the v1 format
 */
export function toV1Message(bundle: V2.MessageBundle): V1.Message {
	const variants: V1.Variant[] = []
	const selectorNames = new Set<string>()

	for (const message of bundle.messages) {
		// collect all selector names
		for (const selector of message.selectors.map(toV1Expression)) {
			selectorNames.add(selector.name)
		}

		// collect all variants
		for (const variant of message.variants) {
			variants.push({
				languageTag: message.locale,
				match: variant.match,
				pattern: toV1Pattern(variant.pattern),
			})
		}
	}

	const selectors: V1.Expression[] = [...selectorNames].map((name) => ({
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
 * @throws If the pattern cannot be represented in the v1 format
 */
function toV1Pattern(pattern: V2.Pattern): V1.Pattern {
	return pattern.map((element) => {
		switch (element.type) {
			case "text": {
				return {
					type: "Text",
					value: element.value,
				}
			}

			case "expression": {
				return toV1Expression(element)
			}

			default: {
				throw new Error(`Unsupported pattern element type`)
			}
		}
	})
}

function toV1Expression(expression: V2.Expression): V1.Expression {
	if (expression.annotation !== undefined)
		throw new Error("Cannot convert an expression with an annotation to the v1 format")

	if (expression.arg.type !== "variable") {
		throw new Error("Can only convert variable references to the v1 format")
	}

	return {
		type: "VariableReference",
		name: expression.arg.name,
	}
}

export function fromV1Message(v1Message: V1.Message): V2.MessageBundle {
	const languages = dedup(v1Message.variants.map((variant) => variant.languageTag))

	const messages: V2.Message[] = languages.map((language): V2.Message => {
		//All variants that will be part of this message
		const v1Variants = v1Message.variants.filter((variant) => variant.languageTag === language)

		//find all selector names
		const selectorNames = new Set<string>()
		for (const v1Selector of v1Message.selectors) {
			selectorNames.add(v1Selector.name)
		}
		const selectors: V2.Expression[] = [...selectorNames].map((name) => ({
			type: "expression",
			annotation: undefined,
			arg: {
				type: "variable",
				name: name,
			},
		}))

		//The set of variables that need to be defined - Certainly includes the selectors
		const variableNames = new Set<string>(selectorNames)
		const variants: V2.Variant[] = []
		for (const v1Variant of v1Variants) {
			for (const element of v1Variant.pattern) {
				if (element.type === "VariableReference") {
					variableNames.add(element.name)
				}
			}

			variants.push({
				match: v1Variant.match,
				pattern: fromV1Pattern(v1Variant.pattern),
			})
		}

		//Create an input declaration for each variable and selector we need
		const declarations: V2.Declaration[] = [...variableNames].map((name) => ({
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
		id: v1Message.id,
		alias: v1Message.alias,
		messages,
	}
}

function fromV1Pattern(pattern: V1.Pattern): V2.Pattern {
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
 * Dedups an array by converting it to a set and back
 */
const dedup = <T extends Array<unknown>>(arr: T): T => [...new Set(arr)] as T
