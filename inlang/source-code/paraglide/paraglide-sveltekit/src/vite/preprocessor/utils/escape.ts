export const escapeForDoubleQuotes = (str: string) => str.replace(/"/g, '\\"')

export const escapeForTemplateString = (str: string) =>
	str.replace(/`/g, "\\`").replace(/\${/g, "\\${")

export const toJSIdentifier = (str: string) => {
	//replace all non-alphanumeric characters with underscores
	str = str.replace(/[^a-zA-Z0-9]/g, "_")
	//If the first character is a number, prefix it with an underscore
	if ((str[0] ?? "").match(/[0-9]/)) str = "_" + str
	return str
}
