import type { AttributeValue } from "../types.js"
import { escapeForTemplateString } from "./escape.js"

/**
 * Takes in an AST of an AttributeValue and returns JS code that evaluates to the same value.
 * @param values - An array of AttributeValues
 * @param originalCode - The original code that the AST was parsed from, neede to sample the expression code
 * @returns A JS expression that evaluates to the same value as the AttributeValue
 */
export function attrubuteValuesToJSValue(
	values: AttributeValue[] | boolean | string,
	originalCode: string
): string {
	if (typeof values === "boolean") return values.toString()
	if (typeof values === "string") return "`" + escapeForTemplateString(values) + "`"

	let templateString = "`"

	if (!(Symbol.iterator in Object(values))) {
		console.error(values)
	}

	for (const value of values) {
		switch (value.type) {
			case "Text":
				templateString += escapeForTemplateString(value.data)
				break
			case "AttributeShorthand":
			case "MustacheTag": {
				const expressionCode = originalCode.slice(value.expression.start, value.expression.end)
				templateString += "${"
				templateString += expressionCode
				templateString += "}"
				break
			}
		}
	}

	templateString += "`"
	return templateString
}