import type { Message, Pattern } from '@inlang/app';

// TODO: create global util function
export const createMessage = (id: string, patterns: Record<string, Pattern | string>): Message => ({
	id,
	selectors: [],
	variants:
		Object.entries(patterns).map(([languageTag, patterns]) => ({
			languageTag,
			match: {},
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
})
