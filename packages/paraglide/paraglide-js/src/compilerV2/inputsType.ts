import { escapeForSingleQuoteString } from "../services/codegen/escape.js"
import { isValidJSIdentifier } from "../services/valid-js-identifier/index.js"

export type InputTypeMap = Record<string, "NonNullable<unknown>">

/**
 * Generates a JSDoc comment for an input object
 *
 * Returns an empty string if the params object is empty.
 *
 * @example
 *   const jsdoc = jsdocFromParams({ name: "NonNullable<unknown>", count: "NonNullable<unknown>" })
 *   const message = `/** ${paramsType} *\/ const mes2 => \`Hello ${params.name}! You have ${params.count} messages.\``
 */
export const inputsType = (params: InputTypeMap, isMessagesIndex: boolean) => {
	if (Object.keys(params).length === 0) {
		return isMessagesIndex ? "@param {{}} inputs" : ""
	}

	const fieldTypes: `${string}: ${string}`[] = []
	for (const [name, type] of Object.entries(params)) {
		if (isValidJSIdentifier(name)) {
			fieldTypes.push(`${name}: ${type}`)
		} else {
			fieldTypes.push(`'${escapeForSingleQuoteString(name)}': ${type}`)
		}
	}

	return `@param {{ ${fieldTypes.join(", ")} }} inputs`
}
