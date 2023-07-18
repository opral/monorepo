import type { Message, Pattern, Resource } from "../ast/schema.js"
import type { BCP47LanguageTag } from "../languageTag/index.js"

export const createResource = (languageTag: BCP47LanguageTag, ...messages: Message[]) =>
	({
		type: "Resource",
		languageTag: {
			type: "LanguageTag",
			name: languageTag,
		},
		body: messages,
	} satisfies Resource)

export const createMessage = (id: string, pattern: string | Pattern["elements"]) =>
	({
		type: "Message",
		id: { type: "Identifier", name: id },
		pattern: {
			type: "Pattern",
			elements: typeof pattern === "string" ? [{ type: "Text", value: pattern }] : pattern,
		},
	} satisfies Message)
