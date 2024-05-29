import { LanguageTag, MessageBundle, Message, Text, Variant } from "./types.js"

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
export function createMessage(args: {
	locale: LanguageTag
	text: string
	match?: Array<string>
}): Message {
	return {
		locale: args.locale,
		declarations: [],
		selectors: [],
		variants: [{ match: args.match ? args.match : [], pattern: [toTextElement(args.text ?? "")] }],
	}
}

export function toTextElement(text: string): Text {
	return {
		type: "text",
		value: text,
	}
}

/**
 * add a variant to a message (mutates the bundle)
 * @example addVariantToMessage(message, variant)
 */
export function upsertVariantOfMessage(message: Message, variant: Variant): void {
	message.variants = message.variants.filter((v) => !isEqualMatcher(v, variant))
	message.variants.push(variant)
}

function isEqualMatcher(a: Variant, b: Variant): boolean {
	return JSON.stringify(a.match) === JSON.stringify(b.match)
}
