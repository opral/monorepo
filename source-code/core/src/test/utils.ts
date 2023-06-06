import type { Language, Message, Pattern, Resource } from '../ast/schema.js'

export const createResource = (language: Language, ...messages: Message[]) =>
({
	type: "Resource",
	languageTag: {
		type: "LanguageTag",
		name: language,
	},
	body: messages,
} satisfies Resource)

export const createMessage = (id: string, pattern: string | Pattern['elements']) =>
({
	type: "Message",
	id: { type: "Identifier", name: id },
	pattern: {
		type: "Pattern",
		elements: typeof pattern === 'string' ? [{ type: "Text", value: pattern }] : pattern,
	},
} satisfies Message)
