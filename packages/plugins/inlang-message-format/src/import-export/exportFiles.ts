import type { Bundle, Declaration, ExportFile, Match, Message, Variant } from "@inlang/sdk2"
import { type plugin } from "../plugin.js"
import type { FileSchema } from "../fileSchema.js"

export const exportFiles: NonNullable<(typeof plugin)["exportFiles"]> = async ({
	bundles,
	messages,
	variants,
}) => {
	const files: Record<string, FileSchema> = {}

	for (const message of messages) {
		const bundle = bundles.find((b) => b.id === message.bundleId)
		const variantsOfMessage = variants.filter((v) => v.messageId === message.id)
		files[message.locale] = {
			...files[message.locale],
			...serializeMessage(bundle!, message, variantsOfMessage),
		}
	}

	const result: ExportFile[] = []

	for (const locale in files) {
		result.push({
			locale,
			// beautify the json
			content: new TextEncoder().encode(JSON.stringify(files[locale], undefined, "\t")),
			name: locale + ".json",
		})
	}

	return result
}

function serializeMessage(
	bundle: Bundle,
	message: Message,
	variants: Variant[]
): Record<string, string | Record<string, string>> {
	const key = message.bundleId
	const value = serializeVariants(bundle, message, variants)
	return { [key]: value }
}

function serializeVariants(
	bundle: Bundle,
	message: Message,
	variants: Variant[]
): string | Record<string, any> {
	// single variant
	// todo add logic for handling if a variant has a match even if it's
	// the only variant
	if (variants.length === 1) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return serializePattern(variants[0]!.pattern)
	}
	const entries = []
	for (const variant of variants) {
		const match = serializeMatcher(variant.matches)
		const pattern = serializePattern(variant.pattern)
		entries.push([match, pattern])
	}

	return {
		// naively adding all declarations, even if unused in the variants
		// can be optimized later.
		declarations: bundle.declarations.map(serializeDeclaration),
		selectors: message.selectors.map((s) => s.name),
		match: Object.fromEntries(entries),
	}
}

function serializePattern(pattern: Variant["pattern"]): string {
	let result = ""

	for (const part of pattern) {
		if (part.type === "text") {
			result += part.value
		} else if (part.arg.type === "variable-reference") {
			result += `{${part.arg.name}}`
		} else {
			throw new Error("Unsupported expression type")
		}
	}
	return result
}

// input: { platform: "android", userGender: "male" }
// output: `platform=android,userGender=male`
function serializeMatcher(matches: Match[]): string {
	const parts = []
	for (const match of matches) {
		if (match.type === "literal-match") {
			parts.push(`${match.key}=${match.value}`)
		} else {
			parts.push(`${match.key}=*`)
		}
	}
	return parts.join(", ")
}

function serializeDeclaration(declaration: Declaration): string {
	if (declaration.type === "input-variable") {
		return `input ${declaration.name}`
	} else if (declaration.type === "local-variable") {
		let result = ""
		if (declaration.value.arg.type === "variable-reference") {
			result = `local ${declaration.name} = ${declaration.value.arg.name}`
		} else if (declaration.value.arg.type === "literal") {
			result = `local ${declaration.name} = "${declaration.value.arg.value}"`
		}
		if (declaration.value.annotation) {
			result += `: ${declaration.value.annotation.name}`
		}
		return result
	}
	throw new Error("Unsupported declaration type")
}
