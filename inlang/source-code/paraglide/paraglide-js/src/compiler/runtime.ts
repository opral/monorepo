import type { LanguageTag, Variant } from "@inlang/sdk"

let selectors: Variant["match"] = {}

let languageTag: LanguageTag

export const getLanguageTag = (): LanguageTag => {
	return languageTag
}

export const setLanguageTag = (tag: LanguageTag) => {
	languageTag = tag
}

export const getSelectors = (): Variant["match"] => {
	return selectors
}

export const setSelectors = (newSelectors: Variant["match"]) => {
	selectors = newSelectors
}

/**
 * Lookup function for a message.
 */
export const m = (id: keyof (typeof messages)["en"], params: Record<string, any>): string => {
	if (languageTag === undefined) throw new Error("Language tag is not set.")
	// @ts-expect-error - params is not typed
	return messages[id](params)
}

const messages = {
	en: {
		simple: () => "Login",
		oneParam: (params: { name: string }) => `Hello ${params.name}!`,
		multipleParams: (params: { name: string; count: number }) =>
			`Hello ${params.name}! You have ${params.count} messages.`,
		// TODO implement multiple variants
		// TODO beneath is an example of how an implementation could look like
		// multipleVariants: (params: { name: string }) => {
		// 	const selectorOrdering = ["operatingSystem", "weekday"]
		// 	const variants = [
		// 		{
		// 			match: { operatingSystem: "mac" },
		// 			pattern: `Hello ${params.name}! You are on a mac.`,
		// 		},
		// 		{
		// 			match: { operatingSystem: "windows" },
		// 			pattern: `Hello ${params.name}! You are on windows.`,
		// 		},
		// 		{
		// 			match: { operatingSystem: "windows", weekday: "monday" },
		// 			pattern: `Hello ${params.name}! It's a beautiful Monday. PS you are on windows.`,
		// 		},
		// 		{
		// 			match: { weekday: "monday" },
		// 			pattern: `Hello ${params.name}! It's a beautiful Monday!`,
		// 		},
		// 	]
		// 	return matchVariant(selectorOrdering, variants)
		// },
	},
}
