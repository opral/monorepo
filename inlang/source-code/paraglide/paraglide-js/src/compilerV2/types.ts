export type Compilation<Node> = {
	/** The original AST node */
	source: Node
	/** The code generated to implement the AST node */
	code: string
	/** The type-Restrictions discovered by compiling the node */
	typeRestrictions: Record<string, string>
}

/**
 * Attempts to merge type restrictions from two variants.
 */
export function mergeTypeRestrictions(
	a: Record<string, string>,
	b: Record<string, string>
): Record<string, string> {
	const result = structuredClone(a)
	for (const [key, value] of Object.entries(b)) {
		const existingValue = result[key]
		// if we don't yet have a type, use it
		if (!existingValue) {
			result[key] = value
			continue
		}

		// if the type is the same contiune
		if (existingValue === value) continue

		// if both have a type, use the more specific one
		if (typeSpecificity(existingValue) < typeSpecificity(value)) {
			result[key] = value
		}
	}
	return result
}

function typeSpecificity(type: string): number {
	if (type === "NonNullable<unknown>") return 0
	else return 1
}
