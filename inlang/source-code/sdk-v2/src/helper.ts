import { randomHumanId } from "./human-id/human-readable-id.js"
import { v4 as uuid } from "uuid"
import type {
	Expression,
	LanguageTag,
	NestedBundle,
	NestedMessage,
	Text,
	Variant,
} from "./types/index.js"

/**
 * create v2 Bundle with a random human ID
 * @example createBundle({
 *   messages: [
 * 		 createMessage({locale: "en", text: "Hello world!"})
 * 		 createMessage({locale: "de", text: "Hallo Welt!"})
 *   ]
 * })
 */
export function createBundle(args: {
	id?: string
	messages: NestedMessage[]
	alias?: NestedBundle["alias"]
}): NestedBundle {
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
	bundleId: string
	locale: LanguageTag
	text: string
	match?: Record<Expression["arg"]["name"], string>
}): NestedMessage {
	const messageId = uuid()
	return {
		bundleId: args.bundleId,
		id: messageId,
		locale: args.locale,
		declarations: [],
		selectors: [],
		variants: [createVariant({ messageId: messageId, text: args.text, match: args.match })],
	}
}

/**
 * create v2 Variant AST with text-only pattern
 * @example createVariant({match: ["*"], text: "Hello world"})
 */
export function createVariant(args: {
	messageId: string
	id?: string
	text?: string
	match?: Record<Expression["arg"]["name"], string>
}): Variant {
	return {
		messageId: args.messageId,
		id: args.id ? args.id : uuid(),
		match: args.match ? args.match : {},
		pattern: [toTextElement(args.text ?? "")],
	}
}

export function toTextElement(text: string): Text {
	return {
		type: "text",
		value: text,
	}
}
