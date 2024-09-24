/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Bundle, LiteralMatch, Message, Pattern, Variant } from "@inlang/sdk2"
import { type plugin } from "../plugin.js"
import { unflatten } from "flat"

export const exportFiles: NonNullable<(typeof plugin)["exportFiles"]> = async ({ bundles }) => {
	const result: Record<string, Record<string, any>> = {}

	const messages = bundles.flatMap((bundle) => bundle.messages)

	for (const message of messages) {
		const serializedMessages = serializeMessage(
			bundles.find((b) => b.id === message.bundleId)!,
			message,
			message.variants
		)

		for (const message of serializedMessages) {
			if (result[message.locale] === undefined) {
				result[message.locale] = {}
			}
			result[message.locale]![message.key] = message.value
		}
	}

	return Object.entries(result).map(([locale, messages]) => ({
		locale,
		content: new TextEncoder().encode(JSON.stringify(unflatten(messages), undefined, "\t") + "\n"),
		// TODO the path should be configurable
		path: `mock/${locale}.json`,
	}))
}

function serializeMessage(
	bundle: Bundle,
	message: Message,
	variants: Variant[]
): Array<{ key: string; value: string; locale: string }> {
	const result = []

	const hasContext = bundle.declarations.some(
		(declaration) => declaration.type === "input-variable" && declaration.name === "context"
	)

	const hasPlurals = bundle.declarations.some(
		(declaration) =>
			declaration.type === "local-variable" &&
			declaration.value.annotation?.type === "function-reference" &&
			declaration.value.annotation?.name === "plural"
	)

	for (const variant of variants) {
		const pattern = serializePattern(variant.pattern)
		const contextMatch = variant.matches.find(
			(match) => match.type === "literal-match" && match.key === "context"
		) as LiteralMatch | undefined
		const pluralMatch = variant.matches.find(
			(match) => match.type === "literal-match" && match.key === "countPlural"
		) as LiteralMatch | undefined

		const isCatchAll = variant.matches.some((match) => match.type === "catchall-match")

		if (hasContext && contextMatch === undefined) {
			throw new Error("The variant does not have a context match")
		}
		if (hasPlurals && pluralMatch === undefined) {
			throw new Error("The variant does not have a plural match")
		}
		// matches need to be appended
		// 'keyContext' -> 'keyContext_match'
		let key: string
		if (hasContext && hasPlurals && isCatchAll) {
			key = `${bundle.id}_${contextMatch?.value}`
		} else if (hasContext && hasPlurals && isCatchAll === false) {
			key = `${bundle.id}_${contextMatch?.value}_${pluralMatch?.value}`
		} else if (hasContext === false && hasPlurals) {
			key = `${bundle.id}_${pluralMatch?.value}`
		} else if (hasContext && hasPlurals === false) {
			key = `${bundle.id}_${contextMatch?.value}`
		} else {
			key = bundle.id
		}
		const value = pattern
		result.push({ key, value, locale: message.locale })
	}

	return result
}

function serializePattern(pattern: Pattern): string {
	let result = ""

	for (const part of pattern) {
		if (part.type === "text") {
			result += part.value
		} else if (part.arg.type === "variable-reference" && part.annotation === undefined) {
			result += `{{${part.arg.name}}}`
		} else if (
			part.arg.type === "variable-reference" &&
			part.annotation !== undefined &&
			part.annotation.options.length === 0
		) {
			result += `{{${part.arg.name}, ${part.annotation.name}}}`
		} else if (
			part.arg.type === "variable-reference" &&
			part.annotation !== undefined &&
			part.annotation.options.length > 0
		) {
			throw new Error("Not implemented")
		}
	}

	return result
}
