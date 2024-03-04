import { privateEnv } from "@inlang/env-variables"
import type { LanguageTag } from "@inlang/language-tag"
import { getVariant, Text, type Message, VariableReference } from "@inlang/sdk"
import type { Result } from "@inlang/result"

export async function machineTranslateMessage(args: {
	message: Message
	sourceLanguageTag: LanguageTag
	targetLanguageTags: LanguageTag[]
}): // must return a string as en error because needs to be serializable
Promise<Result<Message, string>> {
	try {
		if (!privateEnv.GOOGLE_TRANSLATE_API_KEY) {
			throw new Error("GOOGLE_TRANSLATE_API_KEY is not set")
		}
		const copy = structuredClone(args.message)
		for (const targetLanguageTag of args.targetLanguageTags) {
			if (
				!args.sourceLanguageTag ||
				!args.message.variants.some((variant) => variant.languageTag === args.sourceLanguageTag)
			) {
				throw new Error("Source language configuration missing")
			}
			for (const variant of args.message.variants.filter(
				(variant) => variant.languageTag === args.sourceLanguageTag
			)) {
				const targetVariant = getVariant(args.message, {
					where: {
						languageTag: targetLanguageTag,
						match: variant.match,
					},
				})
				if (targetVariant) {
					continue
				}
				const placeholderMetadata: PlaceholderMetadata = {}
				const response = await fetch(
					"https://translation.googleapis.com/language/translate/v2?" +
						new URLSearchParams({
							q: serializePattern(variant.pattern, placeholderMetadata),
							target: targetLanguageTag,
							source: args.sourceLanguageTag,
							// html to escape placeholders
							format: "html",
							key: privateEnv.GOOGLE_TRANSLATE_API_KEY,
						}),
					{ method: "POST" }
				)
				if (!response.ok) {
					return { error: response.statusText }
				}
				const json = await response.json()
				const translation = json.data.translations[0].translatedText
				copy.variants.push({
					languageTag: targetLanguageTag,
					match: variant.match,
					pattern: deserializePattern(translation),
				})
			}
		}
		return { data: copy }
	} catch (error) {
		console.error(error)
		return { error: error?.toString() ?? "unknown error" }
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

function serializePattern(
	pattern: Message["variants"][number]["pattern"],
	placeholderMetadata: PlaceholderMetadata
) {
	let result = ""
	for (const [i, element] of pattern.entries()) {
		if (element.type === "Text") {
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
			placeholderMetadata[element.name] = {
				leadingCharacter: result.at(-1) ?? undefined,
				trailingCharacter:
					pattern[i + 1]?.type === "Text" ? (pattern[i + 1] as Text).value[0] : undefined,
			}
			result += `${escapeStart}${JSON.stringify(element)}${escapeEnd}`
		}
	}
	return result
}

function deserializePattern(text: string): Message["variants"][number]["pattern"] {
	const result: Message["variants"][number]["pattern"] = []
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
			result.push({ type: "Text", value: unescapedText.slice(i) })
			break
		}
		// placeholder somewhere in the middle
		else if (i < start) {
			result.push({ type: "Text", value: unescapedText.slice(i, start) })
			// move the index to the start of the placeholder and avoid pushing the same text element multiple times
			i = start
			continue
		}
		const end = unescapedText.indexOf(escapeEnd, start)
		if (end === -1) {
			result.push({ type: "Text", value: unescapedText.slice(i) })
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

		result.push(placeholder)
		i = end + escapeEnd.length
	}
	return result
}
