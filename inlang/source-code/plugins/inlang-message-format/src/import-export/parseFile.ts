import type { MessageNested, Variant } from "@inlang/sdk2"

export function parseFile(args: { locale: string; content: ArrayBuffer }): MessageNested[] {
	const json = JSON.parse(new TextDecoder().decode(args.content))

	const messages: MessageNested[] = []

	for (const key in json) {
		if (key === "$schema") {
			continue
		}
		messages.push(
			parseMessage({
				key,
				value: json[key],
				locale: args.locale,
			})
		)
	}
	return messages
}

function parseMessage(args: {
	key: string
	value: string | Record<string, string>
	locale: string
}): MessageNested {
	// happy_sky_eye + _ + en
	const messageId = args.key + "_" + args.locale
	const variants = parseVariants(messageId, args.value)

	return {
		id: messageId,
		bundleId: args.key,
		declarations: [],
		selectors: [],
		locale: "en",
		variants,
	}
}

function parseVariants(messageId: string, value: string | Record<string, string>): Variant[] {
	// single variant
	if (typeof value === "string") {
		return [
			{
				id: messageId,
				messageId,
				match: {},
				pattern: parsePattern(value),
			},
		]
	}
	// multi variant
	const variants: Variant[] = []
	for (const variant of Object.values(value)) {
		variants.push({
			id: messageId,
			messageId,
			match: {},
			pattern: parsePattern(variant),
		})
	}
	return variants
}

function parsePattern(value: string): Variant["pattern"] {
	const pattern: Variant["pattern"] = []

	// splits a pattern like "Hello {name}!" into an array of parts
	// "hello {name}, how are you?" -> ["hello ", "{name}", ", how are you?"]
	const parts = value.split(/(\{.*?\})/)

	for (const part of parts) {
		// it's text
		if ((part.startsWith("{") && part.endsWith("}")) === false) {
			pattern.push({ type: "text", value: part })
		}
		// it's an expression (only supporting variables for now)
		else {
			const variableName = part.slice(1, -1)
			pattern.push({ type: "expression", arg: { type: "variable", name: variableName } })
		}
	}

	return pattern
}
