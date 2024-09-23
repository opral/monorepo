import { type Match, type MessageNested, type NewBundleNested, type Variant } from "@inlang/sdk2"
import { type plugin } from "../plugin.js"

export const importFiles: NonNullable<(typeof plugin)["importFiles"]> = async ({ files }) => {
	const messages = files.flatMap(parseFile)
	const bundlesIndex: Record<string, any> = {}

	for (const message of messages) {
		if (bundlesIndex[message.bundleId] === undefined) {
			bundlesIndex[message.bundleId] = {
				id: message.bundleId,
				declarations: [],
				messages: [message],
			}
		} else {
			bundlesIndex[message.bundleId].messages.push(message)
		}
	}

	const bundles = Object.values(bundlesIndex) as NewBundleNested[]

	return { bundles }
}

function parseFile(args: { locale: string; content: ArrayBuffer }): MessageNested[] {
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
		selectors: [],
		locale: args.locale,
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
				matches: [],
				pattern: parsePattern(value),
			},
		]
	}
	// multi variant
	const variants: Variant[] = []
	for (const [matcher, pattern] of Object.entries(value["match"] as string)) {
		variants.push({
			// "some_happy_cat_en;platform=ios,userGender=female"
			id: messageId + ";" + matcher.replaceAll(" ", ""),
			messageId,
			matches: parseMatcher(matcher),
			pattern: parsePattern(pattern),
		})
	}
	return variants
}

function parsePattern(value: string): Variant["pattern"] {
	const pattern: Variant["pattern"] = []

	// splits a pattern like "Hello {name}!" into an array of parts
	// "hello {name}, how are you?" -> ["hello ", "{name}", ", how are you?"]
	const parts = value.split(/(\{.*?\})/).filter((part) => part !== "")

	for (const part of parts) {
		// it's text
		if ((part.startsWith("{") && part.endsWith("}")) === false) {
			pattern.push({ type: "text", value: part })
		}
		// it's an expression (only supporting variables for now)
		else {
			const variableName = part.slice(1, -1)
			pattern.push({ type: "expression", arg: { type: "variable-reference", name: variableName } })
		}
	}

	return pattern
}

// input: `platform=android,userGender=male`
// output: { platform: "android", userGender: "male" }
function parseMatcher(value: string): Match[] {
	const stripped = value.replace(" ", "")
	const matches: Match[] = []
	const parts = stripped.split(",")
	for (const part of parts) {
		const [key, value] = part.split("=")
		if (!key || !value) {
			continue
		}
		matches.push({
			type: "match",
			name: key,
			value: {
				type: "literal",
				value,
			},
		})
	}
	return matches
}
