export type Registry = {
	[name: string]: {
		signature: {
			/**
			 * The type of the Input value
			 */
			input: string

			/**
			 * The types of the options
			 */
			options: {
				[name: string]: string
			}

			/**
			 * The output type of the function
			 */
			output: string
		}
	}
}

export const registry: Registry = {
	plural: {
		signature: {
			input: "number",
			options: {
				localeMatcher: '"lookup" | "best-fit"',
				type: '"cardinal" | "ordinal"',
			},
			output: '"zero" | "one" | "two" | "few" | "many" | "other"',
		},
	},
}
