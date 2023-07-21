
export const logDeprecation = (oldName: string, newName: string) =>
	console.warn(`[INLANG:DEPRECATED] '${oldName}' is deprecated. Use '${newName}' instead.`)