import { randomHumanId } from "../storage/human-id/human-readable-id.js"
import { randomId } from "./randomId.js"
import { LanguageTag, MessageBundle, Message, Text, Variant } from "./types/index.js"

/**
 * create v2 MessageBundle with a random human ID
 * @example createMessageBundle({
 *   messages: [
 * 		 createMessage({locale: "en", text: "Hello world!"})
 * 		 createMessage({locale: "de", text: "Hallo Welt!"})
 *   ]
 * })
 */
export function createMessageBundle(args: {
	id?: string
	messages: Message[]
	alias?: MessageBundle["alias"]
}): MessageBundle {
	return {
		id: args.id ?? randomHumanId(),
		alias: args.alias ?? {},
		messages: args.messages,
	}
}

/**
 * create v2 Messsage AST with a randomId, and text-only pattern
 * @example createMessage({locale: "en", text: "Hello world"})
 */
export function createMessage(args: {
	locale: LanguageTag
	text: string
	match?: Array<string>
}): Message {
	return {
		id: randomId(),
		locale: args.locale,
		declarations: [],
		selectors: [],
		variants: [createVariant({ text: args.text, match: args.match })],
	}
}

/**
 * create v2 Variant AST with text-only pattern
 * @example createVariant({match: ["*"], text: "Hello world"})
 */
export function createVariant(args: {
	id?: string
	text?: string
	match?: Array<string>
}): Variant {
	return {
		id: args.id ? args.id : randomId(),
		match: args.match ? args.match : [],
		pattern: [toTextElement(args.text ?? "")],
	}
}

export function toTextElement(text: string): Text {
	return {
		type: "text",
		value: text,
	}
}