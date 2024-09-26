import type { Match, Variant, MessageImport, VariantImport, Bundle } from "@inlang/sdk2"
import { type plugin } from "../plugin.js"

export const importFiles: NonNullable<(typeof plugin)["importFiles"]> = async ({ files }) => {
	const bundles: Bundle[] = []
	const messages: MessageImport[] = []
	const variants: VariantImport[] = []

	for (const file of files) {
		const json = JSON.parse(new TextDecoder().decode(file.content))

		for (const key in json) {
			if (key === "$schema") {
				continue
			}
			const result = parseMessage(key, file.locale, json[key])
			messages.push(result.message)
			variants.push(...result.variants)

			const existingBundle = bundles.find((b) => b.id === result.bundle.id)
			if (existingBundle === undefined) {
				bundles.push(result.bundle)
			} else {
				// merge declarations without duplicates
				existingBundle.declarations = removeDuplicates([
					existingBundle.declarations,
					...result.bundle.declarations,
				])
			}
		}
	}

	return { bundles, messages, variants }
}

function parseMessage(
	key: string,
	locale: string,
	value: string | Record<string, string>
): {
	bundle: Bundle
	message: MessageImport
	variants: VariantImport[]
} {
	const variants = parseVariants(key, locale, value)

	return {
		bundle: {
			id: key,
			declarations: [],
		},
		message: {
			bundleId: key,
			selectors: [],
			locale: locale,
		},
		variants,
	}
}

function parseVariants(
	bundleId: string,
	locale: string,
	value: string | Record<string, string>
): VariantImport[] {
	// single variant
	if (typeof value === "string") {
		return [
			{
				messageBundleId: bundleId,
				messageLocale: locale,
				matches: [],
				pattern: parsePattern(value),
			},
		]
	}
	// multi variant
	const variants: VariantImport[] = []
	for (const [match, pattern] of Object.entries(value["match"] as string)) {
		variants.push({
			messageBundleId: bundleId,
			messageLocale: locale,
			matches: parseMatch(match),
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
function parseMatch(value: string): Match[] {
	const stripped = value.replace(" ", "")
	const matches: Match[] = []
	const parts = stripped.split(",")
	for (const part of parts) {
		const [key, value] = part.split("=")
		if (!key || !value) {
			continue
		}
		if (value === "*") {
			matches.push({
				type: "catchall-match",
				key: key,
			})
		} else {
			matches.push({
				type: "literal-match",
				key,
				value,
			})
		}
	}
	return matches
}

const removeDuplicates = <T extends any[]>(arr: T) =>
	[...new Set(arr.map((item) => JSON.stringify(item)))].map((item) => JSON.parse(item))
