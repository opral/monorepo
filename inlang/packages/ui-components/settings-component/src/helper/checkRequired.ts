/*
 * Checks if a property is required in a schema.
 *
 * @param schema: Record<string, any> | undefined
 * @param property: string
 */
const checkRequired = (schema: Record<string, any> | undefined, property: string): boolean => {
	if (schema && schema.required && schema.required.includes(property)) {
		return true
	}
	return false
}

export default checkRequired
