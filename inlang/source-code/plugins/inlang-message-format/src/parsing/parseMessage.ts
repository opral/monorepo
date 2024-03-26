import type { LanguageTag, Message, Pattern } from "@inlang/sdk"
import { parsePattern } from "./parsePattern.js"

export const parseMessage = (args: {
	key: string
	value: string
	languageTag: LanguageTag
}): Message => {
	try {
		return parseMessageWithVariants(args)
		// eslint-disable-next-line no-empty
	} catch (e) {}

	return {
		id: args.key,
		alias: {},
		selectors: [],
		variants: [
			{
				languageTag: args.languageTag,
				match: [],
				pattern: parsePattern(args.value),
			},
		],
	}
}
/**
 * Attempts to parse a message with multiple variants.
 *
 * This is _very_ hacky & should not make it to production. I can think of a dozen edge-cases, but it'll do for prototyping
 *
 * @throws If a syntax error is found
 */
function parseMessageWithVariants(args: {
	key: string
	value: string
	languageTag: LanguageTag
}): Message {
	if (!args.value.startsWith("match")) throw new Error("Syntax error")

	const parts = args.value.split("when")
	const selectorPart = parts[0]
	if (!selectorPart) throw new Error("Syntax error")
	const selectorSource = selectorPart.replace("match", "").trim()

	//selectors is a bunch of `{var1} {var2}`. We want variable-references for them all
	const selectors = parsePattern(selectorSource).filter(
		(part): part is Extract<Pattern, { type: "VariableReference" }> =>
			part.type === "VariableReference"
	)

	const variants: Message["variants"] = []
	for (let i = 1; i < parts.length; i++) {
		const variantSource = parts[i]
		if (!variantSource) throw new Error("Syntax error")

		const [matchPart, ...patternPart] = variantSource.split("{")
		if (!patternPart.length) throw new Error("Syntax error")

		const patternParts = patternPart.join("{").split("}")
		patternParts.pop()
		const patternSource = patternParts.join("}")

		if (!matchPart || !patternSource) throw new Error("Syntax error")

		const match = matchPart.trim().split(" ")
		if (match.length !== selectors.length) throw new Error("Syntax error")

		variants.push({
			languageTag: args.languageTag,
			match,
			pattern: parsePattern(patternSource),
		})
	}

	return {
		id: args.key,
		alias: {},
		selectors,
		variants,
	}
}
