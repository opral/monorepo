import type { Message, Resource } from "@inlang/core/ast"

export const createResource = (language: string, ...messages: Message[]) =>
	({
		type: "Resource",
		languageTag: {
			type: "LanguageTag",
			name: language,
		},
		body: messages,
	} satisfies Resource)

export const createMessage = (id: string, pattern: string) =>
	({
		type: "Message",
		id: { type: "Identifier", name: id },
		pattern: {
			type: "Pattern",
			elements: [{ type: "Text", value: pattern }],
		},
	} satisfies Message)
