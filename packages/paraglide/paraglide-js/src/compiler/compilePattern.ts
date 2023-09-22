import type { Expression, Pattern } from "@inlang/sdk"

export const compilePattern = (pattern: Pattern): string => {
	let result = ""
	// parameter names and TypeScript types
	// only allowing types that JS transpiles to strings under the hood like string and number.
	// the pattern nodes must be extended to hold type information in the future.
	const params: Array<{ name: Expression["name"]; type: "NonNullable<unknown>" }> = []
	for (const element of pattern) {
		switch (element.type) {
			case "Text":
				result += element.value
				break
			case "VariableReference":
				result += "${params." + element.name + "}"
				params.push({ name: element.name, type: "NonNullable<unknown>" })
				break
			default:
				throw new Error("Unknown pattern element type: " + element)
		}
	}
	if (params.length > 0) {
		// construct JSDoc comment for typesafe params
		result = `/** @param {{ ${params
			.map((p) => p.name + ": " + p.type)
			.join(", ")} }} params */(params) => \`${result}\``
	} else {
		result = `() => \`${result}\``
	}
	return result
}
