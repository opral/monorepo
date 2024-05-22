import { LanguageTag, MessageBundle, Message, Text } from "./types.js"

/**
 * create v2 MessageBundle
 * @example createMessageBundle({
 * 	 id: "greeting",
 *   messages: [
 * 		 createMessage({locale: "en", text: "Hello world!"})
 * 		 createMessage({locale: "de", text: "Hallo Welt!"})
 *   ]
 * })
 */
export function createMessageBundle(args: {
	id: string
	messages: Message[]
	alias?: MessageBundle["alias"]
}): MessageBundle {
	return {
		id: args.id,
		alias: args.alias ?? {},
		messages: args.messages,
	}
}

/**
 * create v2 Messsage AST with text-only pattern
 * @example createMessage({locale: "en", text: "Hello world"})
 */
export function createMessage(args: { locale: LanguageTag; text: string }): Message {
	return {
		locale: args.locale,
		declarations: [],
		selectors: [],
		variants: [{ match: [], pattern: [toTextElement(args.text ?? "")] }],
	}
}

function toTextElement(text: string): Text {
	return {
		type: "text",
		value: text,
	}
}
