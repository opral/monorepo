/**
 * Detects the formatting of a JSON file and returns a function
 * that can be used to stringify JSON with the same formatting.
 *
 * @example
 *   const file = await fs.readFile("./messages.json", { encoding: "utf-8" })
 *   const stringify = detectJsonFormatting(file)
 *   const newFile = stringify(json)
 */
export const detectJsonFormatting = (
	file: string
): ((
	value: Parameters<typeof JSON.stringify>[0],
	replacer?: Parameters<typeof JSON.stringify>[1]
	// space is provided by the function
) => string) => {
	let endsWithNewLine: boolean | undefined
	let spacing: string | number | undefined

	// check end with new line
	if (file.endsWith("\n")) {
		endsWithNewLine = true
	}

	//check spacing
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

	for (const value of patterns) {
		if (value.regex.test(file)) {
			spacing = value.spacing
		}
	}

	return (value, replacer) =>
		JSON.stringify(value, replacer, spacing) + (endsWithNewLine ? "\n" : "")
}
