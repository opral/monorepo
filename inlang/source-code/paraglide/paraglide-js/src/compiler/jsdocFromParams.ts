export type Params = Record<string, "NonNullable<unknown>">

/**
 * Generates a JSDoc comment from a params object.
 *
 * Returns an empty string if the params object is empty.
 *
 * @example
 *   const jsdoc = jsdocFromParams({ name: "NonNullable<unknown>", count: "NonNullable<unknown>" })
 *   const message = `${jsdoc}(params) => \`Hello ${params.name}! You have ${params.count} messages.\``
 */
export const jsdocFromParams = (params: Params) => {
	if (Object.keys(params).length === 0) {
		return ""
	}
	return `/** @param {{ ${Object.entries(params)
		.map(([name, type]) => name + ": " + type)
		.join(", ")} }} params */`
}
