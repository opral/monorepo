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
		},
	},
}
