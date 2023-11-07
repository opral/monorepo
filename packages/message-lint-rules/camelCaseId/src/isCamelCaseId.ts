export const isCamelCaseId = (id: string) => {
	return /^[a-z]+([A-Z][a-z]+)*$/.test(id)
}
