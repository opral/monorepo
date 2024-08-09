export type Compilation = {
	code: string
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
		if (key in a) result[key] = `${a[key]} & ${value}`
		else result[key] = value
	}
	return result
}
