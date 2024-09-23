/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Bundle, BundleNested, Message, Variant } from "@inlang/sdk2"
import { type plugin } from "../plugin.js"
import { flatten } from "flat"

export const importFiles: NonNullable<(typeof plugin)["importFiles"]> = async ({ files }) => {
	const result: BundleNested[] = []
	const bundles: Bundle[] = []
	const messages: Message[] = []
	const variants: Variant[] = []

	for (const file of files) {
		const result = parseFile({ locale: file.locale, content: file.content })
		bundles.push(...result.bundles)
		messages.push(...result.messages)
		variants.push(...result.variants)
	}

	// merge the bundle declarations
	const uniqueBundleIds = [...new Set(bundles.map((bundle) => bundle.id))]
	const uniqueBundles: Bundle[] = uniqueBundleIds.map((id) => {
		const _bundles = bundles.filter((bundle) => bundle.id === id)
		const declarations = [...new Set(_bundles.flatMap((bundle) => bundle.declarations))]
		return { id, declarations }
	})

	// establishing nesting
	for (const bundle of uniqueBundles) {
		const bundleNested: BundleNested = { ...bundle, messages: [] }

		// @ts-expect-error - casting the type here
		bundleNested.messages = messages.filter((message) => message.bundleId === bundle.id)

		for (const message of bundleNested.messages) {
			message.variants = variants.filter((variant) => variant.messageId === message.id)
		}

		result.push(bundleNested)
	}

	return { bundles: result }
}

function parseFile(args: { locale: string; content: ArrayBuffer }): {
	bundles: Bundle[]
	messages: Message[]
	variants: Variant[]
} {
	const resource: Record<string, string | string[]> = flatten(
		JSON.parse(new TextDecoder().decode(args.content))
	)

	const bundles: Bundle[] = []
	const messages: Message[] = []
	const variants: Variant[] = []

	for (const key in resource) {
		const value = resource[key]!
		const { bundle, message, variant } = parseMessage({ key, value, locale: args.locale, resource })
		bundles.push(bundle)
		messages.push(message)
		variants.push(variant)
	}
	return { bundles, messages, variants }
}

function parseMessage(args: {
	key: string
	value: string | string[]
	locale: string
	resource: Record<string, any>
}): { bundle: Bundle; message: Message; variant: Variant } {
	const bundle: Bundle = {
		id: args.key,
		declarations: [],
	}

	const message: Message = {
		id: args.key,
		bundleId: args.key,
		selectors: [],
		locale: args.locale,
	}

	const variant: Variant = {
		id: args.key,
		messageId: args.key,
		matches: [],
		pattern: parsePattern(args.value),
	}

	// plural, see https://www.i18next.com/misc/json-format#i18next-json-v4
	if (
		args.key.endsWith("_zero") ||
		args.key.endsWith("_one") ||
		args.key.endsWith("_two") ||
		args.key.endsWith("_few") ||
		args.key.endsWith("_many") ||
		args.key.endsWith("_other")
	) {
		variant.matches = [
			{
				// i18next only allows matching against a count variable
				// suffixing plural because the inlang sdk v2 purposefully
				// did not allow using a variable with a function like `plural`
				// without declaring a new variable to reduce complexity
				type: "match",
				name: "countPlural",
				value: { type: "literal", value: args.key.split("_").at(-1)! },
			},
		]
		bundle.declarations.push({
			type: "local-variable",
			name: "countPlural",
			value: {
				type: "expression",
				arg: {
					type: "variable-reference",
					name: "count",
				},
				annotation: {
					type: "function-reference",
					name: "plural",
					options: [],
				},
			},
		})
	}

	return { bundle, message, variant }
}

function parsePattern(value: string | string[]): Variant["pattern"] {
	const pattern: Variant["pattern"] = []

	if (Array.isArray(value)) {
		// i18next allows arrays as values
		// https://www.i18next.com/translation-function/objects-and-arrays#arrays
		//
		// odd choice, hard to support in an e2e localization workflow. hence,
		// we're just going to convert arrays to strings, assuming that a tiny
		// minority of users are using arrays as values and having them as string is fine
		value = value.toString()
	}

	// splits a pattern like "Hello {{name}}!" into an array of parts
	// "hello {{name}}, how are you?" -> ["hello ", "{{name}}", ", how are you?"]
	const parts = value.split(/(\{{.*?\}})/).filter((part) => part !== "")

	for (const part of parts) {
		// it's text
		if ((part.startsWith("{{") && part.endsWith("}")) === false) {
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
