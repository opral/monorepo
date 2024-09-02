import { privateEnv } from "@inlang/env-variables"
import type { Result } from "@inlang/result"
import {
	createVariant,
	Text,
	VariableReference,
	type Variant,
	type BundleNested,
} from "@inlang/sdk2"

export async function machineTranslateMessage(args: {
	bundle: BundleNested
	baseLocale: string
	targetLocales: string[]
}): Promise<Result<BundleNested, string>> {
	try {
		if (!privateEnv.GOOGLE_TRANSLATE_API_KEY) {
			throw new Error("GOOGLE_TRANSLATE_API_KEY is not set")
		}

		const copy = structuredClone(args.bundle)

		// Iterate over each message in the bundle
		for (const message of args.bundle.messages) {
			// Skip if the message locale does not match the base locale
			if (message.locale !== args.baseLocale) {
				continue
			}

			// Proceed only if the message has exactly one variant
			if (message.variants.length !== 1) {
				continue
			}

			const baseVariant = message.variants[0]

			// Skip if the variant has no pattern
			if (!baseVariant) {
				continue
			}

			const q = serializePattern(baseVariant.pattern, {})

			// Translate the variant for each target locale
			for (const targetLocale of args.targetLocales) {
				let translation: string

				if (!process.env.MOCK_TRANSLATE) {
					const response = await fetch(
						"https://translation.googleapis.com/language/translate/v2?" +
							new URLSearchParams({
								q,
								target: targetLocale,
								source: args.baseLocale,
								format: "html",
								key: privateEnv.GOOGLE_TRANSLATE_API_KEY,
							}),
						{ method: "POST" }
					)

					if (!response.ok) {
						const err = `${response.status} ${response.statusText}: translating from ${args.baseLocale} to ${targetLocale}`
						return { error: err }
					}

					const json = await response.json()
					translation = json.data.translations[0].translatedText
				} else {
					const mockTranslation = await mockTranslateApi(q, args.baseLocale, targetLocale)
					if (mockTranslation.error) return { error: mockTranslation.error }
					translation = mockTranslation.translation
				}

				// Deserialize the translated pattern
				const translatedPattern = deserializePattern(translation)

				// Create a new message with the translated locale and the translated variant
				const translatedMessage = {
					...message,
					locale: targetLocale,
					variants: [
						createVariant({
							pattern: translatedPattern,
							messageId: message.id,
						}),
					],
				}

				// Add the translated message to the bundle
				copy.messages.push(translatedMessage)
			}
		}

		return { data: copy }
	} catch (error) {
		console.error(error)
		return { error: error?.toString() ?? "unknown error" }
	}
}

// MOCK_TRANSLATE: Mock the google translate api
const mockTranslate = !!process.env.MOCK_TRANSLATE

// MOCK_TRANSLATE_ERRORS: 0 = no errors (default), 1 = all errors, n > 1 = 1/n fraction of errors
const mockErrors = Math.ceil(Number(process.env.MOCK_TRANSLATE_ERRORS)) || 0

// MOCK_TRANSLATE_LATENCY in ms (default 0)
const mockLatency = Number(process.env.MOCK_TRANSLATE_LATENCY) || 0

if (mockTranslate) {
	const errors = mockErrors === 0 ? "no" : mockErrors === 1 ? "all" : `1/${mockErrors}`
	// eslint-disable-next-line no-console
	console.log(`🥸 Mocking machine translate api with ${errors} errors, ${mockLatency}ms latency`)
}

// Keep track of the number mock of calls, so we can simulate errors
let mockCount = 0

/**
 * Mock the google translate api with a delay.
 * Enable by setting MOCK_TRANSLATE to true.
 *
 * Optionally set
 * - MOCK_TRANSLATE_LATENCY to simulate latency: default=0 (ms),
 * - MOCK_TRANSLATE_ERRORS to simulate errors: default=0.
 *   - 0: no errors
 *   - 1: only errors
 *   - n > 1: 1/n fraction of errors
 */
async function mockTranslateApi(
	q: string,
	sourceLanguageTag: string,
	targetLanguageTag: string
): Promise<{ translation: string; error?: string }> {
	mockCount++
	const error = mockCount % mockErrors === 0 ? "Mock error" : undefined
	const prefix = `Mock translate ${sourceLanguageTag} to ${targetLanguageTag}: `
	// eslint-disable-next-line no-console
	// console.log(`${error ? "💥 Error " : ""}${prefix}${q.length > 50 ? q.slice(0, 50) + "..." : q}`)
	await new Promise((resolve) => setTimeout(resolve, mockLatency))
	return {
		translation: prefix + q,
		error,
	}
}

/**
 * Thanks to https://issuetracker.google.com/issues/119256504?pli=1 this crap is required.
 *
 * Storing the placeholdermetadata externally to be uneffected by the api.
 */
type PlaceholderMetadata = Record<
	string,
	{
		leadingCharacter?: string
		trailingCharacter?: string
	}
>

// class="notranslate" tells the google api to not translate the innner element
const escapeStart = `<span class="notranslate">`
const escapeEnd = "</span>"

function serializePattern(pattern: Variant["pattern"], placeholderMetadata: PlaceholderMetadata) {
	let result = ""
	for (const [i, element] of pattern.entries()) {
		if (element.type === "text") {
			// google translate api doesn't like carrigage returns and line feeds in html format,
			// so we replace them with placeholders and replace them back after translation
			result += element.value
				.replaceAll("\r", "<inlang-CarriageReturn>")
				.replaceAll("\n", "<inlang-LineFeed>")
		} else {
			// ugliest code ever thanks to https://issuetracker.google.com/issues/119256504?pli=1
			//   1. escape placeholders
			//   2. store leading and trailing character of the placeholder
			//      (using cL and cT to save translation costs that are based on characters)
			// TODO: handle placeholder with correct type
			// @ts-expect-error
			placeholderMetadata[element.name] = {
				leadingCharacter: result.at(-1) ?? undefined,
				trailingCharacter:
					pattern[i + 1]?.type === "text" ? (pattern[i + 1] as Text).value[0] : undefined,
			}
			result += `${escapeStart}${JSON.stringify(element)}${escapeEnd}`
		}
	}
	return result
}

function deserializePattern(text: string): Variant["pattern"] {
	const result: Variant["pattern"] = []
	// google translate espaces quotes, need to replace the escaped stuff
	const unescapedText = text
		.replaceAll("&quot;", '"')
		.replaceAll("&#39;", "'")
		.replaceAll("<inlang-CarriageReturn>", "\r")
		.replaceAll("<inlang-LineFeed> ", "\n")
	let i = 0
	while (i < unescapedText.length) {
		const start = unescapedText.indexOf(escapeStart, i)
		// no placeholders, immediately return text
		if (start === -1) {
			result.push({ type: "text", value: unescapedText.slice(i) })
			break
		}
		// placeholder somewhere in the middle
		else if (i < start) {
			result.push({ type: "text", value: unescapedText.slice(i, start) })
			// move the index to the start of the placeholder and avoid pushing the same text element multiple times
			i = start
			continue
		}
		const end = unescapedText.indexOf(escapeEnd, start)
		if (end === -1) {
			result.push({ type: "text", value: unescapedText.slice(i) })
			break
		}

		const placeholderAsText = unescapedText.slice(start + escapeStart.length, end)
		const placeholder = JSON.parse(placeholderAsText) as VariableReference

		// can't get it running, ignoring for now
		// const lastElement = result[result.length]
		// if (
		// 	lastElement?.type === "Text" &&
		// 	lastElement.value.endsWith(placeholderMetadata[placeholder.name]!.leadingCharacter!) === false
		// ) {
		// 	// remove the latst, very likely hallucinated from the translate api, character
		// 	;(result[result.length] as Text).value = lastElement.value.slice(0, -2)
		// }
		// if (unescapedText[i + 1] !== placeholderMetadata[placeholder.name]!.trailingCharacter) {
		// 	i++
		// }

		// TODO: handle placeholder with correct type
		// @ts-expect-error
		result.push(placeholder)
		i = end + escapeEnd.length
	}
	return result
}
