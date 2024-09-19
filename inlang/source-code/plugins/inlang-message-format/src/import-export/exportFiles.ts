import type { MessageNested, ResourceFile, Variant } from "@inlang/sdk2"
import { PLUGIN_KEY, type plugin } from "../plugin.js"
import type { FileSchema } from "../fileSchema.js"

export const exportFiles: NonNullable<(typeof plugin)["exportFiles"]> = async ({
	bundles,
	settings,
}) => {
	const pathPattern = settings[PLUGIN_KEY]?.pathPattern
	if (pathPattern === undefined) {
		throw new Error("pathPattern is not defined")
	}

	const files: Record<string, FileSchema> = {}

	const messages = bundles.flatMap((bundle) => bundle.messages)
	for (const message of messages) {
		files[message.locale] = { ...files[message.locale], ...serializeMessage(message) }
	}

	const result: ResourceFile[] = []

	for (const locale in files) {
		result.push({
			locale,
			// beautify the json
			content: new TextEncoder().encode(JSON.stringify(files[locale], undefined, '\t')),
			path: pathPattern.replace("{locale}", locale),
			pluginKey: PLUGIN_KEY,
		})
	}

	return result
}

function serializeMessage(message: MessageNested): {
	[key: string]: string | Record<string, string>
} {
	const key = message.bundleId
	const value = serializeVariants(message.variants)
	return { [key]: value }
}

function serializeVariants(variants: Variant[]): string | Record<string, string> {
	// single variant
	// todo add logic for handling if a variant has a match even if it's
	// the only variant
	if (variants.length === 1) {
		return serializePattern(variants[0]!.pattern)
	}
	const entries = []
	for (const variant of variants) {
		const match = serializeMatcher(variant.match)
		const pattern = serializePattern(variant.pattern)
		entries.push([match, pattern])
	}

	return {
		match: Object.fromEntries(entries),
	}
}

function serializePattern(pattern: Variant["pattern"]): string {
	let result = ""

	for (const part of pattern) {
		if (part.type === "text") {
			result += part.value
		} else if (part.arg.type === "variable") {
			result += `{${part.arg.name}}`
		} else {
			throw new Error("Unsupported expression type")
		}
	}
	return result
}

// input: { platform: "android", userGender: "male" }
// output: `platform=android,userGender=male`
function serializeMatcher(match: Record<string, string>): string {
	const parts = Object.entries(match).map(([key, value]) => `${key}=${value}`)
	return parts.join(", ")
}
