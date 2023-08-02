/**
 * Detects the nesting of the JSON file.
 *
 * @example detectJsonSpacing(stringifiedFile)
 */
export const detectIsNested = (file: string): boolean | undefined => {
	const json = JSON.parse(file)
	if (file === "{}") return undefined
	for (const value of Object.values(json)) {
		if (typeof value === "object") {
			return true
		}
	}
	return false
}

/**
 * Detects the spacing of a JSON string.
 *
 * @example detectJsonSpacing(stringifiedFile)
 */
export const detectJsonSpacing = (jsonString: string) => {
	const patterns = [
		{
			spacing: 1,
			regex: /^{\n {1}[^ ]+.*$/m,
		},
		{
			spacing: 2,
			regex: /^{\n {2}[^ ]+.*$/m,
		},
		{
			spacing: 3,
			regex: /^{\n {3}[^ ]+.*$/m,
		},
		{
			spacing: 4,

			regex: /^{\n {4}[^ ]+.*$/m,
		},
		{
			spacing: 6,
			regex: /^{\n {6}[^ ]+.*$/m,
		},
		{
			spacing: 8,
			regex: /^{\n {8}[^ ]+.*$/m,
		},
		{
			spacing: "\t",
			regex: /^{\n\t[^ ]+.*$/m,
		},
	]

	for (const { spacing, regex } of patterns) {
		if (regex.test(jsonString)) {
			return spacing
		}
	}

	// No matching spacing configuration found
	return undefined
}

/**
 * replaceAll for old Browsers
 *
 * @example replaceAll("abs def abc", "abc", "o")
 */

export function replaceAll(str: string, find: string, replace: string) {
	return str.replace(new RegExp(escapeRegExp(find), "g"), replace)
}

function escapeRegExp(string: string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // $& means the whole matched string
}
