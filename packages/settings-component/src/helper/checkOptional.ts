const checkOptional = (schema: Record<string, any> | undefined, property: string): boolean => {
	if (schema && schema.required && schema.required.includes(property)) {
		return true
	}
	return false
}

export default checkOptional
