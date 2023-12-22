import type { Pattern } from "@inlang/sdk"

/**
 * Compiles a pattern into a template literal string.
 *
 * @example
 *  const { compiled, params } = compilePattern([{ type: "Text", value: "Hello " }, { type: "VariableReference", name: "name" }])
 *  >> compiled === "`Hello ${params.name}`"
 */
export const compilePattern = (
	pattern: Pattern
): {
	params: Record<string, "NonNullable<unknown>">
	compiled: string
} => {
	let result = ""
	const params: Record<string, "NonNullable<unknown>"> = {}
	for (const element of pattern) {
		switch (element.type) {
			case "Text":
				result += escapeForTemplateLiteral(element.value)
				break
			case "VariableReference":
				result += "${params." + element.name + "}"
				params[element.name] = "NonNullable<unknown>"
				break
			default:
				throw new Error("Unknown pattern element type: " + element)
		}
	}
	return {
		params,
		compiled: "`" + result + "`",
	}
}

/**
 * Escapes some Text so that it can safely be used inside a template literal.
 * @param text
 * @returns
 */
function escapeForTemplateLiteral(text: string): string {
	return text.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\${/g, "\\${")
}