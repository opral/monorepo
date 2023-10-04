import type { Message, Pattern } from "@inlang/message"

export const createMessage = (id: string, patterns: Record<string, Pattern | string>) =>
	({
		id,
		selectors: [],
		variants: Object.entries(patterns).map(([languageTag, patterns]) => ({
			languageTag,
			match: [],
			pattern:
				typeof patterns === "string"
					? [
							{
								type: "Text",
								value: patterns,
							},
					  ]
					: patterns,
		})),
	} satisfies Message)
