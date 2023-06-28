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
