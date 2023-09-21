export const detectJsonFormatting = (file?: string): DetectJsonFormattingApi => {
	const formatting: DetectJsonFormattingApi["values"] = {
		endWithNewLine: true,
		nestedKeys: false,
		spacing: 2,
	}

	// check end with new line
	if (file && !file.endsWith("\n")) {
		formatting["endWithNewLine"] = false
	}

	// check nested or flattend keys
	if (file) {
		const json = JSON.parse(file)
		for (const value of Object.values(json)) {
			if (typeof value === "object") {
				formatting["nestedKeys"] = true
			}
		}
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

	if (file) {
		for (const { spacing, regex } of patterns) {
			if (regex.test(file)) {
				formatting["spacing"] = spacing
			}
		}
	}

	return {
		values: formatting,
		serialize: (json: Record<string, unknown>) =>
			JSON.stringify(json, undefined, formatting["spacing"]) +
			(formatting["endWithNewLine"] ? "\n" : ""),
	}
}

// types

export type DetectJsonFormattingApi = {
	values: FormattingValues
	serialize: (json: Record<string, unknown>) => string
}

type FormattingValues = {
	endWithNewLine: boolean
	nestedKeys: boolean
	spacing: string | number
}
