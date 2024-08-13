import { escapeForSingleQuoteString } from "../services/codegen/escape.js"
import { isValidJSIdentifier } from "../services/valid-js-identifier/index.js"

export type InputTypeMap = Record<string, string>

/**
 * Generates a JSDoc comment for an input object
 * Returns an empty string if the input object is empty.
 */
export const inputsType = (inputs: InputTypeMap, isMessagesIndex: boolean) => {
	if (Object.keys(inputs).length === 0) {
		return isMessagesIndex ? "@param {{}} inputs" : ""
	}

	const typeEntries: string[] = []
	for (const [name, type] of Object.entries(inputs)) {
		const line = isValidJSIdentifier(name)
			? `${name}: ${type}`
			: `'${escapeForSingleQuoteString(name)}': ${type}`

		typeEntries.push(line)
	}

	return `@param {{ ${typeEntries.join(", ")} }} inputs`
}
