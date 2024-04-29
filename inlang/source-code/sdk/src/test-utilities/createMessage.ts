import type * as LegacyFormat from "@inlang/message"

/**
 * @deprecated Uses Legacy Message Format
 */
export const createMessage = (
	id: string,
	patterns: Record<string, LegacyFormat.Pattern | string>
) =>
	({
		id,
		alias: {},
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
	} satisfies LegacyFormat.Message)
