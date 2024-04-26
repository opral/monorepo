import type { Message, Pattern, Translation } from "@inlang/message"

export const createMessage = (id: string, patterns: Record<string, Pattern | string>): Message => {
	return {
		id,
		alias: {},
		inputs: [],
		translations: [
			...Object.entries(patterns).map(
				([languageTag, patterns]): Translation => ({
					languageTag,
					declarations: [],
					selectors: [],
					variants: [
						typeof patterns === "string"
							? {
									match: [],
									pattern: [
										{
											type: "text",
											value: patterns,
										},
									],
							  }
							: {
									match: [],
									pattern: patterns,
							  },
					],
				})
			),
		],
	}
}
